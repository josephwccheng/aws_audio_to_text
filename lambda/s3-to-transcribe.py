import json
# import two packages to help us with dates and date formatting
from time import gmtime, strftime

# import the AWS SDK (for Python the package name is boto3)
import boto3

def lambda_handler(event, context):
# Creating a transcribe service
    client = boto3.client('transcribe')
    s3_prefix =  "s3://audio-analysis-poc/audio file/"
# store the current time in a human readable format in a variable
    now = strftime("%a-%d-%b-gmt-%Y-%H-%M-%S", gmtime())
# Validate input body to see if it contains 'audioFile'
    if not "audioFile" in event:
        return {
            "statusCode": 400,
            "body": 'could not find audioFile in body'
        }
    file = s3_prefix + event["audioFile"]
    maxSpeaker = 5
    mediaType = event["audioFile"].split(".")[1]
# Validate input parameters
    if mediaType not in ('mp3','mp4','wav','flac','ogg','amr','webm'):
        return {
            'statusCode': 400,
            'body': "Incorrect formatting for mediaType. Transcribe supports 'mp3','mp4','wav','flac','ogg','amr', and 'webm' format"
        }
# Start Async Transcription Job based on two inputs, file source and language    
    response = client.start_transcription_job(
        TranscriptionJobName = "transcribe-lambda-trigger-" + now,
        LanguageCode = "en-US",
        MediaSampleRateHertz = 44100,
        MediaFormat = mediaType,
        Media = {
            "MediaFileUri": file
        },
        Settings= {
            "ShowSpeakerLabels": True,
            "MaxSpeakerLabels": maxSpeaker,
        },
        OutputBucketName='audio-analysis-poc',
        OutputKey='transcribe_output/'
    )
    return {
        'statusCode': response['ResponseMetadata']['HTTPStatusCode'],
        'body': json.dumps(response['TranscriptionJob'], default=str)
    }
