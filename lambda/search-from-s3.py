import json
import boto3

client_kendra = boto3.client('kendra')

def lambda_handler(event, context):
    query='call'
    index_id='3106f857-4f61-4e0a-8f97-e7514bee475d'
    
    response=client_kendra.query(
            QueryText = event['query'],
            IndexId = index_id)
    output = []
    for query_result in response['ResultItems']:
        # if query_result['Type']=='ANSWER':
        #     answer_text = query_result['DocumentExcerpt']['Text']
        #     output.append({
        #         "type": query_result['Type'],
        #         "text": answer_text
        #     })
        if query_result['Type']=='DOCUMENT':
            if 'DocumentTitle' in query_result:
                document_title = query_result['DocumentTitle']['Text']
            document_text = query_result['DocumentExcerpt']['Text']
            output.append({
                "type":query_result['Type'],
                "text": document_text,
                "document_title": document_title,
                "document_id": query_result['DocumentId'],
                "highlights": query_result['DocumentExcerpt']['Highlights']
            })

    return {
        'statusCode': 200,
        'body': output
    }

