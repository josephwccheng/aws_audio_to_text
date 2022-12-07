import json

import boto3

def lambda_handler(event, context):
    if len(event['text']) > 5000:
        text = event['text'][:5000]
    else:
        text = event['text']      

    client = boto3.client('comprehend')
    response_sentiment = client.detect_sentiment(
        Text=text,
        LanguageCode="en"
    )
    response_pii = client.detect_pii_entities(
        Text=text,
        LanguageCode="en"
    )
    response_entities = client.detect_entities(
        Text=text,
        LanguageCode="en"
    )
    response = {
        'sentiment': response_sentiment['Sentiment'],
        'sentiment_scores': response_sentiment['SentimentScore'],
        'response_pii': response_pii['Entities'],
        'response_entities': response_entities['Entities']
    }
    return {
        'statusCode': 200,
        'body': json.dumps(response, default=str)
    }
