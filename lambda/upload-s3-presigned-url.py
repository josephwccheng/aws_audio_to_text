import json
import boto3

def lambda_handler(event, context):
# Create a s3 client
    key = 'audio file/' + event['fileName']
    url = boto3.client('s3').generate_presigned_url(
        ClientMethod='put_object', 
        Params={'Bucket': 'audio-analysis-poc', 
                'Key': key,
                'ContentType': event['contentType']
        },
        ExpiresIn=3600
    )
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps(url)
    }