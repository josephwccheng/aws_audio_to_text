import json

def lambda_handler(event, context):
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps(""" --- This is the Call Center Audio Analytics Project ---
            The following are the API's for this project
            1. GET /datasource - retrieves all audio data within the S3 bucket
            2. GET /transcribe - trasncribe job status (i.e. INPROGRESS / COMPLETE). If complete, also outputs the transcribe api output
                - Input: "transcribe job id"
            3. POST /transcribe - triggers a AWS transcribe job
                - Input: "S3 audio file name (Note: do not include any prefix)"
            4. POST /comprehend - triggers AWS comprehend job and retrieves result immediately
                - Input: "Text that requires analysis"
            """)
    }
