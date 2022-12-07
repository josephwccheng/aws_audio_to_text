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
# retrieve list of objects within S3
    prefix = "transcribe_output/"
    response = client.list_objects_v2(Bucket='audio-analysis-poc', Prefix=prefix, Delimiter='/')['Contents']
    unsorted_output = [{ 'fileName': key['Key'].replace(prefix, ''), 'lastModified': key['LastModified']} for key in response]
    sorted_output = sorted(unsorted_output, key=lambda element: element['lastModified'], reverse=True)[:10]

    final_list = [j['fileName'] for j in sorted_output]
    return {
        'statusCode': 200,
        'body': final_list
    }