const app_url = "https://784jj40xq4.execute-api.ap-southeast-2.amazonaws.com/dev/"
var presigned_url = ""
// Support function for uploading file to S3
function getPresignedUrl(fileName) {
    // instantiate a headers object
    var audioFile = $('#file-upload').prop('files')[0];
    var myHeaders = new Headers();
    // add content type header to object
    myHeaders.append("Content-Type", "application/json");
    // using built in JSON utility package turn object to string and store in a variable
    var raw = JSON.stringify({
        "fileName": fileName,
        "contentType": audioFile.type
    });
    // create a JSON object with parameters for API call and store in a variable
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw
    };
    // make API call with parameters and use promises to get response
    fetch(app_url + "upload", requestOptions)
        .then(response => response.json().then(data => {
            presigned_url = JSON.parse(data.body);
            $('#file-selected').html(fileName);
        })).catch(error => console.log('error', error));
}

function uploadFileToS3() {
    var audioFile = $('#file-upload').prop('files')[0];
    var myHeaders = new Headers();
    var requestOptions = {
        method: 'PUT',
        headers: myHeaders,
        body: audioFile
    };
    // make API call with parameters and use promises to get response
    fetch(presigned_url, requestOptions)
        .then(
            response => {
                if (response.status == 200) {
                    alert(audioFile.name + ' upload successfully to AWS S3 bucket')
                }
            })
        .catch(error => console.log('error', error));
}

function listAudioFiles() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            result = JSON.parse(this.responseText);
            var audioList = document.getElementById("audio-files");
            audioList.innerHTML = "";
            for (var i = 0; i < result.body.length; i++) {
                var rowAudio = document.createElement("li");
                rowAudio.className = "audio-file"
                rowAudio.appendChild(document.createTextNode(result.body[i]));
                audioList.appendChild(rowAudio);
            }
        }
    };
    xhttp.open("GET", app_url + "datasource", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send("Your JSON Data Here");
}

function listTranscribeOutputFiles() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            result = JSON.parse(this.responseText);
            var trascribeOutputList = document.getElementById("transcribe-output-files");
            trascribeOutputList.innerHTML = "";
            for (var i = 0; i < result.body.length; i++) {
                var rowOutput = document.createElement("li");
                rowOutput.className = "transcribe-output-file"
                rowOutput.appendChild(document.createTextNode(result.body[i]));
                trascribeOutputList.appendChild(rowOutput);
            }
        }
    };
    xhttp.open("GET", app_url + "output", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send("Your JSON Data Here");
}

function triggerTrancsribeJob(audioFile) {
    // instantiate a headers object
    var myHeaders = new Headers();
    // add content type header to object
    myHeaders.append("Content-Type", "application/json");
    // using built in JSON utility package turn object to string and store in a variable
    var raw = JSON.stringify({ "audioFile": audioFile });
    // create a JSON object with parameters for API call and store in a variable
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    // make API call with parameters and use promises to get response
    fetch(app_url + "transcribe", requestOptions)
        .then(response => response.json().then(data => {
            result = JSON.parse(data.body);
            alert("Transcribe job submitted. Job Name = " + result.TranscriptionJobName);
            var transcribeJobName = document.getElementById("transcribeJobName");
            transcribeJobName.value = result.TranscriptionJobName;
            // console.log(globalThis.result['TranscriptionJobName'])
        })
        )
        .then(
        )

        .catch(error => console.log('error', error));
}

// (TODO) merging confidence score of words and speaker label of transcribe output
function mergeTransConfSpeaker(conf_output, speaker_segments) {
    var output_dict = {};
    var key = "";
    for (var i = 0; i < conf_output.length; i++) {
        var word = conf_output[i];
        if (word.type == "pronunciation") {
            key = word.start_time + "-" + word.end_time;
            output_dict[key] = {
                type: word.type,
                content: word.alternatives[0].content,
                confidence: word.alternatives[0].confidence
            };
        } else {
            // var key = "others-" + parseInt(i);
            output_dict[key + "-punct"] = {
                type: word.type,
                content: word.alternatives[0].content,
                confidence: word.alternatives[0].confidence
            }
        }
    }
    for (var j = 0; j < speaker_segments.length; j++) {
        var segment = speaker_segments[j];
        for (var k = 0; k < segment['items'].length; k++) {
            var word = segment['items'][k];
            var key = word.start_time + "-" + word.end_time;
            // console.log(output_dict[key]);
            output_dict[key]['speaker'] = segment['speaker_label'];
        }
    }
    return output_dict;
}

function createHeaderTable(table_id, header_list) {
    // i.e. transcribe-table has two rows: Speaker and Transcribe
    var table = document.getElementById(table_id);
    table.innerHTML = "";
    var thead = document.createElement("thead");
    thead.className = "thead-dark"
    var row = document.createElement("tr");

    for (var i = 0; i < header_list.length; i++) {
        var column = document.createElement("th");
        column.innerHTML = header_list[i];
        row.appendChild(column);
    }
    thead.appendChild(row);
    table.appendChild(thead);

}

function getTranscriptResult() {
    // instantiate a headers object
    var myHeaders = new Headers();
    // add content type header to object
    myHeaders.append("Content-Type", "application/json");
    var transcribeJobName = document.getElementById("transcribeJobName").value;
    var raw = JSON.stringify({ "TranscriptionJobName": transcribeJobName });
    // TranscriptOutput is used in step 6 to retrieve the text for comprehend call
    var transcriptOutput = document.getElementById("transcribeOutput");
    transcriptOutput.value = "";
    var transcribeTable = document.getElementById("transcribe-table");
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    // make API call with parameters and use promises to get response
    fetch(app_url + "transcribe/status", requestOptions)
        .then(response => response.json().then(data => {
            // console.log(data);
            if (data.statusCode == 201) {
                document.getElementById("transcribeStatus").innerHTML = data.body;
                document.getElementById("speaker_identified").innerHTML = "";
                transcribeTable.innerHTML = "";
            } else {
                result = JSON.parse(data.body);
                // Update the Text box with pure text for STEP 6
                transcriptOutput.value = result['results']['transcripts'][0]['transcript'];
                // Merge Confidence Result and Speaker Result as One
                var merged_transcription_result = mergeTransConfSpeaker(result['results']['items'], result['results']['speaker_labels']['segments']);

                // populate the Transcribe table like a conversation with speakers and text
                createHeaderTable("transcribe-table", ["Speaker", "Transcribe"]);
                var prev_speaker = "";
                var row = document.createElement("tr");
                var speaker = document.createElement("td");
                var conversation = document.createElement("td");
                var len_merged_result = Object.keys(merged_transcription_result).length;
                var index_merged = 1;
                for (const [key, word] of Object.entries(merged_transcription_result)) {
                    var word_span = document.createElement("span");
                    word_span.innerHTML = word.content;
                    var space = document.createElement("span");
                    space.innerHTML = " ";
                    if (word.type == "pronunciation") {
                        // For Confidence score coloring
                        if (word.confidence < 0.8 && word.confidence > 0.5) {
                            word_span.className = "bg-warning"
                        } else if (word.confidence < 0.5) {
                            word_span.className = "bg-danger"
                        }
                        if (word.speaker != prev_speaker) {
                            // when it's changing speakers reset conversation
                            if (prev_speaker != "") {
                                row.appendChild(speaker);
                                row.appendChild(conversation);
                                transcribeTable.appendChild(row);

                                row = document.createElement("tr");
                                speaker = document.createElement("td");
                                conversation = document.createElement("td");
                            }
                            // update the state
                            conversation.appendChild(word_span);
                            conversation.appendChild(space);
                            speaker.innerHTML = word.speaker;
                            prev_speaker = word.speaker;
                        } else {
                            speaker.innerHTML = word.speaker;
                            conversation.appendChild(word_span);
                            conversation.appendChild(space);
                        }
                    } else {
                        conversation.appendChild(word_span);
                    }
                    // takeing care of end scenario
                    if (index_merged == len_merged_result) {
                        row.appendChild(speaker);
                        row.appendChild(conversation);
                        transcribeTable.appendChild(row);
                    }
                    index_merged = index_merged + 1;

                }

                // no need to print out transcribe status if job is done
                document.getElementById("transcribeStatus").innerHTML = "";
                // Obtaining Speaker label for each word
                document.getElementById("speaker_identified").innerHTML = "Number of Speakers Identified: " + result['results']['speaker_labels']['speakers'];
            }
        }))
        .catch(error => console.log('error', error));
}

function getComprehendResult() {
    var transcribeText = document.getElementById("transcribeOutput");
    // instantiate a headers object
    var myHeaders = new Headers();
    // add content type header to object
    myHeaders.append("Content-Type", "application/json");
    // using built in JSON utility package turn object to string and store in a variable
    var raw = JSON.stringify({ "text": transcribeText.value });
    // create a JSON object with parameters for API call and store in a variable
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    // make API call with parameters and use promises to get response
    fetch(app_url + "comprehend", requestOptions)
        .then(response => response.json().then(data => {
            result = JSON.parse(data.body);
            console.log(result);
            // create Sentiment Table from Comprehend result
            var sentimentTable = document.getElementById("sentimentTable");
            var sentimentResult = document.getElementById("sentimentResult");
            sentimentTable.innerHTML = "";
            // header row for sentiment table
            sentimentResult.innerHTML = "Overall Sentiment was: " + result.sentiment;
            createHeaderTable("sentimentTable", ["Sentiment", "Score"]);

            // result of sentiment
            for (const [key, value] of Object.entries(result.sentiment_scores)) {
                var rowOutput = document.createElement("tr");
                var rowSentiment = document.createElement("td");
                var rowConfidence = document.createElement("td");
                // rowOutput.className = "sentiment"
                rowSentiment.innerHTML = key;
                rowConfidence.innerHTML = value.toFixed(3);
                rowOutput.appendChild(rowSentiment);
                rowOutput.appendChild(rowConfidence);
                sentimentTable.appendChild(rowOutput);
            }
            // create Pii Table from Comprehend result
            var piiTable = document.getElementById("piiTable");
            piiTable.innerHTML = "";
            // header row for Pii table
            createHeaderTable("piiTable", ["Text", "Type", "Score"]);
            // result of Pii
            for (var i = 0; i < result.response_pii.length; i++) {
                var rowOutput = document.createElement("tr");
                var rowText = document.createElement("td");
                var rowType = document.createElement("td");
                var rowScore = document.createElement("td");
                var start = result.response_pii[i].BeginOffset;
                var end = result.response_pii[i].EndOffset;
                rowText.innerHTML = transcribeText.value.substring(start, end);
                rowType.innerHTML = result.response_pii[i].Type;
                rowScore.innerHTML = result.response_pii[i].Score.toFixed(3);;
                rowOutput.appendChild(rowText);
                rowOutput.appendChild(rowType);
                rowOutput.appendChild(rowScore);
                piiTable.appendChild(rowOutput);
            }

            // create Entity Table from Comprehend result
            var entityTable = document.getElementById("entityTable");
            entityTable.innerHTML = "";
            // header row for entity table
            createHeaderTable("entityTable", ["Text", "Type", "Score"]);
            // result of sentiment result
            for (var i = 0; i < result.response_entities.length; i++) {
                var rowOutput = document.createElement("tr");
                var rowText = document.createElement("td");
                var rowType = document.createElement("td");
                var rowScore = document.createElement("td");
                var start = result.response_entities[i].BeginOffset;
                var end = result.response_entities[i].EndOffset;
                rowText.innerHTML = transcribeText.value.substring(start, end);
                rowType.innerHTML = result.response_entities[i].Type;
                rowScore.innerHTML = result.response_entities[i].Score.toFixed(3);;
                rowOutput.appendChild(rowText);
                rowOutput.appendChild(rowType);
                rowOutput.appendChild(rowScore);
                entityTable.appendChild(rowOutput);
            }
        }))
        .catch(error => console.log('error', error));
}

function kendraQuery() {
    var kendraQueryText = document.getElementById("kendraQueryText");
    // instantiate a headers object
    var myHeaders = new Headers();
    // add content type header to object
    myHeaders.append("Content-Type", "application/json");
    // using built in JSON utility package turn object to string and store in a variable
    var raw = JSON.stringify({ "query": kendraQueryText.value });
    // create a JSON object with parameters for API call and store in a variable
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
    };
    // make API call with parameters and use promises to get response
    fetch(app_url + "kendra", requestOptions)
        .then(response => response.json()
            .then(data => {
                var kendraTable = document.getElementById("kendra-table");
                kendraTable.innerHTML = "";
                documentList = data.body;
                createHeaderTable("kendra-table", ["Search Result"])
                for (var i = 0; i < documentList.length; i++) {
                    documentElement = documentList[i];
                    // console.log(documentElement);
                    var rowOutput = document.createElement("tr");
                    var rowContent = document.createElement("td");
                    var documentTitle = document.createElement("h5");
                    documentTitle.innerHTML = documentElement['document_title'];

                    // Highlight key word within document
                    word_index = 0;
                    text = documentElement['text'];
                    var documentContent = document.createElement("span");
                    if (documentElement['highlights'].length == 0) {
                        documentContent.innerHTML = text;
                    } else {
                        for (var j = 0; j < documentElement['highlights'].length; j++) {
                            var textSegment = document.createElement("span");
                            highlight = documentElement['highlights'][j];
                            // Condition to create span if there are texts before highlight
                            if (word_index < highlight['BeginOffset']) {
                                textSegment.innerHTML = text.substring(word_index, highlight['BeginOffset']);
                                documentContent.appendChild(textSegment);
                                word_index = highlight['BeginOffset'];
                            }
                            // appending highlighted content
                            var highlightSegment = document.createElement("strong");
                            highlightSegment.className = "highlighted-text";
                            highlightSegment.innerHTML = text.substring(highlight['BeginOffset'], highlight['EndOffset']);
                            documentContent.appendChild(highlightSegment);
                            word_index = highlight['EndOffset'];
                            // Condition to create span if there are ending text
                            if (j == documentElement['highlights'].length - 1) {
                                textSegment = document.createElement("span");
                                textSegment.innerHTML = text.substring(highlight['EndOffset'], text.length);
                                documentContent.appendChild(textSegment);
                            }
                        }
                    }
                    rowContent.appendChild(documentTitle);
                    rowContent.appendChild(documentContent);
                    rowOutput.appendChild(rowContent);
                    kendraTable.appendChild(rowOutput);
                }
            }))
        .catch(error => console.log('error', error));
}