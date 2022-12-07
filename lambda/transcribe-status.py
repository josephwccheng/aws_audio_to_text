import json
# import the AWS SDK (for Python the package name is boto3)
import boto3

def lambda_handler(event, context):
# Creating a transcribe service
    client_transcribe = boto3.client('transcribe')
    client_s3 = boto3.client('s3')
    client_comprehend = boto3.client('comprehend')
    

    if 'queryStringParameters' in event:
        transcribe_job_name = event['queryStringParameters']['TranscriptionJobName'].split('.')[0]
    else:
        transcribe_job_name = event['TranscriptionJobName'].split('.')[0]
# Proceed witgh checking the transcription job if the validation passes
    response = client_transcribe.get_transcription_job(
        TranscriptionJobName = transcribe_job_name)
# Checking the completion of the AWS Transcription job
    transcriptionStatus = response['TranscriptionJob']['TranscriptionJobStatus']
    if transcriptionStatus != "COMPLETED":
        return {
            'statusCode': 201,
            'body': str(transcriptionStatus) + " , Please wait for the task to complete"       
        }
    else:
# Completed Status
# Obtain the JSON file from the Transcript Output based in our local S3 directory
        transcriptJob = response['TranscriptionJob']
        transcriptFileUri = transcriptJob['Transcript']['TranscriptFileUri']
        s3_file = transcriptFileUri.split('/')[-1]
        s3_prefix = transcriptFileUri.split('/')[-2]
        s3_bucket = transcriptFileUri.split('/')[-3]
        
        s3_result = client_s3.get_object(Bucket=s3_bucket, Key=s3_prefix + "/" + s3_file)
        output = json.loads(s3_result["Body"].read().decode())
        output['transcript_file_uri'] = transcriptFileUri
        text = output['results']['transcripts'][0]['transcript']
# Save Transcription and Comprehend to kendra_output

        if len(text) > 5000:
            response_sentiment = client_comprehend.detect_sentiment(
                Text=text[:4999],
                LanguageCode="en"
            )
        else:
            response_sentiment = client_comprehend.detect_sentiment(
                Text=text,
                LanguageCode="en"
            )        
        
        
        media_file = transcriptJob['Media']['MediaFileUri'].split('/')[-1]
        kendra_output = {
            'media_file': media_file,
            'overall_sentiment': response_sentiment['Sentiment'],
            'transcribe_job_name': output['jobName'],
            'transcript': output['results']['transcripts'][0]['transcript']
        }
    # save kendra output to client_s3
        client_s3.put_object(
            Bucket='audio-analytics-kendra-search', 
            Key='kendra_output/'+ media_file.split('.')[0] +'.json',
            Body=json.dumps(kendra_output, default=str))

# Return the Result of Transcript Output from S3
        return {
            'statusCode': 200,
            'body': json.dumps(output, default=str),
            # 'body': json.dumps(kendra_output, default=str),
        }

# (Extra) If the output of transcript file is not saved to local S3 bucket, then the following code can be used to extract the JSON
# import urllib.request
# response = urllib.request.urlopen(transcriptFileUri)
# data = json.loads(response.read())