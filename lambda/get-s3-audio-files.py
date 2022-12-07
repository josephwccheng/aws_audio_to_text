# import the json utility package since we will be working with a JSON object
import json
# import the AWS SDK (for Python the package name is boto3)
import boto3
# import two packages to help us with dates and date formatting
from time import gmtime, strftime

# creating s3 sesion using AWS SDK
client = boto3.client('s3')
# store the current time in a human readable format in a variable
now = strftime("%a, %d %b %Y %H:%M:%S +0000", gmtime())

# define the handler function that the Lambda service will use as an entry point
def lambda_handler(event, context):
# extract values from the event object we got from the Lambda service and store in a variable
    # name = event['firstName'] +' '+ event['lastName']

# retrieve list of objects within S3
    prefix = "audio file/"
    response = [key['Key'] for key in client.list_objects_v2(Bucket='audio-analysis-poc', Prefix=prefix, Delimiter='/', MaxKeys=100)['Contents']]
    # remove the element with the folder only and not the file
    response.pop(response.index(prefix))
    # remove the prefix of the file path for the audio files
    response = [i.replace(prefix, '') for i in response]
# return a properly formatted JSON object
    return {
        'statusCode': 200,
        'body': response
    }