
// Main JS Functions

var pageTitles = ["Who Am I?", "Engineering", "Programming", "Other Projects", "Don't Press!"];

// Page Load
document.addEventListener("DOMContentLoaded", () => {
    // Assign Element Variables
    banner = document.getElementById("banner");
    navBar = document.getElementById("navBar");
    shortNavBar = document.getElementById("shortNavBar");
    navBarSpacer = document.getElementById("navBarSpacer");

    // Load current Page
    var hashLocation = document.location.hash;
    if (hashLocation != null) {
        var isPorfolio = false;

        // Portfolio Page Load
        if (hashLocation.endsWith("Portfolio")) {
            isPorfolio = true;
            hashLocation = hashLocation.substring(0, hashLocation.length - 9);

            // Remove NavBar
            document.getElementById("navBar").classList.add("hide");
            document.getElementById("shortNavBar").classList.add("hide");
            document.getElementById("navBarSpacer").classList.add("hide");
            document.getElementById("aboutMeEndSpacer").classList.add("hide");

            // Set Pages to be full height
            var pages = document.getElementsByClassName('page');
            for (var i = 0; i < pages.length; i++) {
                pages[i].classList.add("pageFullHeight");
            }
        }
        hashLocation = hashLocation.substring(1);

        // Standard Page Load
        if (document.getElementById(hashLocation + "_") != null) {

            // Remove First Page
            if (!isPorfolio)
                document.getElementById(pageTitles[0].replaceAll(' ', '') + "_").classList.remove("showPage")

            // Show Current Page
            document.getElementById(hashLocation + "_").classList.add("showPage");
            
            // Highlight Correct Button
            document.getElementById("navBar").children[0].classList.remove("selected");
            var currIndex = pageTitles.findIndex((title) => title.replaceAll(' ', '') === hashLocation);
            document.getElementById("navBar").children[currIndex].classList.add("selected");
            document.getElementById("navBarCurrent").firstChild.textContent = pageTitles[currIndex] + " ";
            prevIndex = currIndex;
        }
        // Incorrect Load
        else {
            document.location.hash = '';
        }
    }
});

// Overlay functions
function showOverlay(showId, anchor) {
    if (!document.getElementById("overlay").classList.contains("showOverlay")) {
        document.getElementById("overlay").classList.add("showOverlay");
        document.getElementById("overlay").onclick = function(e) {showOverlay(showId)};
        document.getElementById(showId).classList.add("show");
        // Anchor Element to Self
        if (anchor != null) {
            var rect = anchor.getBoundingClientRect();
            document.getElementById(showId).style.top = rect.bottom + "px";
            document.getElementById(showId).style.left = (rect.right - 125) + "px";            
        }
    }
    else {
        document.getElementById("overlay").classList.remove("showOverlay");
        document.getElementById(showId).classList.remove("show");
        document.body.style.overflowY = "auto";
        // Disable Video just in case
        document.getElementById("galleryImage").children[1].src = null;
    }
}

// Nav Button Sticky Header
var banner = null;
var navBar = null;
var shortNavBar = null;
var navBarSpacer = null;
window.addEventListener("scroll", () => {
    if (window.scrollY >= banner.clientHeight + 20) {
        navBar.classList.add("navBarLock");
        shortNavBar.classList.add("navBarLock");
        navBarSpacer.style.display = "inherit";
    }
    else {
        navBar.classList.remove("navBarLock");
        shortNavBar.classList.remove("navBarLock");
        navBarSpacer.style.display = "none";
    }
});

// Nav Button Selection
var prevIndex = 0;
function showPage(index) {

    // Scroll to Top
    if (window.scrollY >= banner.clientHeight + 20)
        window.scrollTo(0, banner.clientHeight + 20);

    if (index != prevIndex) {
        var prevPage = null;
        var currPage = null;

        // Hide Previous Selection
        document.getElementById("navBar").children[prevIndex].classList.remove("selected");
        prevPage = document.getElementById(pageTitles[prevIndex].replaceAll(' ', '') + "_");
        setTimeout(() => {prevPage.classList.remove("showPage")}, 250);

        // Show Current Selection
        document.getElementById("navBar").children[index].classList.add("selected");
        var pageName = pageTitles[index].replaceAll(' ', '');
        currPage = document.getElementById(pageName + "_");
        currPage.classList.add("showPage");

        // Store Location Name
        document.location.hash = pageName;
        document.getElementById("navBarCurrent").firstChild.textContent = pageTitles[index] + " ";

        // Animations
        if (index > prevIndex) {
            prevPage.style.animation = "slideInFromLeft .25s ease-in-out 0s 1 reverse forwards";
            currPage.style.animation = "slideInFromRight .25s ease-in-out 0s 1 normal forwards";
        }
        else {
            prevPage.style.animation = "slideInFromRight .25s ease-in-out 0s 1 reverse forwards";
            currPage.style.animation = "slideInFromLeft .25s ease-in-out 0s 1 normal forwards";
        }
        // Reset
        setTimeout(() => {prevPage.style.animation = ""}, 250);
        setTimeout(() => {currPage.style.animation = ""}, 250);

        prevIndex = index;
    }
}

// Dropdown Page Selection
function dropdownShowPage(index) {
    showPage(index);
    showOverlay("navList");
}

// About Me Code
function switchPanel(self) {
    var parent = self.parentElement.parentElement;
    var index = -1;
    // Buttons
    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.remove("selected");
        if (parent.children[i].children[0] == self)
            index = i;
    }
    self.parentElement.classList.add("selected");
    // Panels
    parent = document.getElementById("myInterests")
    for (var i = 0; i < parent.children.length; i++) {
        parent.children[i].classList.add("hide");
    }
    parent.children[index].classList.remove("hide");
}

// Engineering Code
function showGallery(self) {
    // Show Image
    console.log(self.style.backgroundImage)
    if (!self.style.backgroundImage.includes("_Thnl")) {
        document.getElementById("galleryImage").children[0].src = self.style.backgroundImage.substring(5, self.style.backgroundImage.length - 2);
        document.getElementById("galleryImage").children[0].style.display = "inherit";
        document.getElementById("galleryImage").children[1].style.display = "none";
    }
    else {
        document.getElementById("galleryImage").children[1].src = self.style.backgroundImage.substring(5, self.style.backgroundImage.length - 11) + ".mp4";
        document.getElementById("galleryImage").children[0].style.display = "none";
        document.getElementById("galleryImage").children[1].style.display = "inherit";
    }
    showOverlay("galleryImage");
    document.body.style.overflowY = "hidden";
}