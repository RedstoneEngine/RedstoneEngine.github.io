
//Modified ShowGallery to transfer info to parent site

function showGallery(self) {
    var src = self.src;
    if (self.hasAttribute("video"))
        src = self.getAttribute("video");

    window.parent.showGalleryCall(src, self.hasAttribute("video"));
}

//Gallery Scroll Features

const observer = new ResizeObserver((entries) => {
    for (let entry of entries) {
        areArrowsDisabled(entry.target);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    //Copy over galleries to mobile-galleries
    var mobileElements = document.getElementsByClassName('mobileElement');

    for (var i = 0; i < mobileElements.length; i++) {
        var mainElement = document.getElementById(mobileElements[i].id.slice(0, -7));
        for (var c = 0; c < mainElement.children.length; c++) {
            var clonedElement = mainElement.children[c].cloneNode(true);
            mobileElements[i].appendChild(clonedElement);
        }
    }

    //Gallery Features
    var galleries = document.getElementsByClassName('gallery');

    for (var i = 0; i < galleries.length; i++) {
        observer.observe(galleries[i]);

        //Setup Arrow Click-Hold Events
        galleries[i].parentElement.parentElement.children[0].addEventListener("mousedown", (e) => {e.preventDefault(); galleryMoveArrows(e.currentTarget)});
        galleries[i].parentElement.parentElement.children[0].addEventListener("touchstart", (e) => {e.preventDefault(); galleryMoveArrows(e.currentTarget)}, {passive: false});
        galleries[i].parentElement.parentElement.children[2].addEventListener("mousedown", (e) => {e.preventDefault(); galleryMoveArrows(e.currentTarget)});
        galleries[i].parentElement.parentElement.children[2].addEventListener("touchstart", (e) => {e.preventDefault(); galleryMoveArrows(e.currentTarget)}, {passive: false});

        galleries[i].addEventListener('wheel', (e) => {
            e.preventDefault();
            e.currentTarget.scrollLeft += e.deltaY;
        });
        galleries[i].addEventListener('scroll', (e) => {
            areArrowsDisabled(e.currentTarget);
        })
    }
});

function galleryMoveArrows(self) {
    //Variables
    var galleryHolder = self.parentElement.children[1].children[0];
    var gallery = galleryHolder.children[0];
    var direction = self == self.parentElement.children[0] ? 1 : -1;
    var currPosition = parseFloat(gallery.style.left.slice(0, -2));
    var currVeloc = 1;
    var maxPosition = galleryHolder.clientWidth - gallery.scrollWidth + 45;

    //Highlight other
    if (!self.classList.contains("disabled"))
        if (direction == 1)
            galleryHolder.parentElement.parentElement.children[2].classList.remove("disabled");
        else
            galleryHolder.parentElement.parentElement.children[0].classList.remove("disabled");

    //Movement
    var moveGallery = setInterval(() => {
        galleryHolder.scrollLeft -= direction * currVeloc;
        if (currVeloc < 8)
            currVeloc += .05;
    }, 1);

    //Stop Holding
    self.onmouseup = function() { clearInterval(moveGallery); }
    self.onmouseleave = function() { clearInterval(moveGallery); }
    self.ontouchend = function() { clearInterval(moveGallery); }
    self.ontouchcancel = function() { clearInterval(moveGallery); }
}

function areArrowsDisabled(galleryHolder) {
    if (galleryHolder.scrollLeft == 0)
        galleryHolder.parentElement.parentElement.children[0].classList.add("disabled");
    else
        galleryHolder.parentElement.parentElement.children[0].classList.remove("disabled");

    if (galleryHolder.scrollLeft + galleryHolder.clientWidth >= galleryHolder.scrollWidth - 5)
        galleryHolder.parentElement.parentElement.children[2].classList.add("disabled");
    else
        galleryHolder.parentElement.parentElement.children[2].classList.remove("disabled");
}

/* Same Function from main.js */

function openLink(link) {
    window.open(link, '_blank');
}