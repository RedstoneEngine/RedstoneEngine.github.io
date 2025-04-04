
// Setup elements to print better
window.addEventListener('beforeprint', (event) => {
    event.preventDefault();
    var elements = document.getElementsByClassName('hideOnPrint');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }
    
    var elements = document.getElementsByClassName('showOnPrint');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = null;
    }

    var elements = document.getElementsByClassName('article');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.maxWidth = "95vw";
        elements[i].style.marginBottom = "15px";
        if (elements[i].classList.contains("lastArticle")) {
            elements[i].style.marginBottom = "0px";
        }
    }

    var elements = document.getElementsByClassName('subarticle');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.height = "475px";
    }

    elements = document.getElementsByTagName('h1');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.textShadow = "none";
        elements[i].style.color = "black";
    }

    var elements = document.getElementsByClassName('section');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.color = "black";
        elements[i].style.lineHeight = "normal";
    }

    var elements = document.getElementsByClassName('gallery');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.height = "420px";
        elements[i].style.marginLeft = "-5px";
        elements[i].style.marginRight = "-5px";
        for (var c = 0;  c < 3; c++) {
            var img = document.createElement('img');
            var imgName = elements[i].children[c].style.backgroundImage;
            img.src =  imgName.substring(5, imgName.length - 2);
            elements[i].children[c].style.backgroundImage = null;
            elements[i].children[c].appendChild(img);
        }
    }

    document.getElementById('starCollection').style.display = "none";
    document.getElementById('asteroidCollection').style.display = "none";
});

/*window.addEventListener('afterprint', (event) => {
});*/