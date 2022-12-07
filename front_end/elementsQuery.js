$(document).ready(function(){
    $('#file-upload').bind('change', function() {
        var fileName = ''; 
        fileName = $(this).val();
        const filteredFileName = fileName.split("fakepath\\")
        getPresignedUrl(filteredFileName[1]);
    })
    $('#uploadAudioForm').on('submit', function () {
        uploadFileToS3();
        return false;
    });
});