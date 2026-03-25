fetch('/public/templates/question-template.html').then((res) => {
    res.text().then((result) => {
        console.log(result);
    });
});