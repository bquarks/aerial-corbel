function *getSomething () {
    yield;
    fetch('https://www.googleapis.com/books/v1/volumes?q=quilting').then(function (res) {
        res.json().then(function (data) {
            yield data;
        });
    });
}

var get = getSomething();


