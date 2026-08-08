
// Main JS Functions

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

        var subDomain = "";
        if (hashLocation.split('_').length > 1) {
            subDomain = hashLocation.split('_')[1];
            hashLocation = hashLocation.split('_')[0];
        }

        // Portfolio Page Load
        if (hashLocation.endsWith("Portfolio")) {
            isPorfolio = true;
            hashLocation = hashLocation.substring(0, hashLocation.length - 9);

            // Remove NavBar
            navBar.classList.add("hide");
            shortNavBar.classList.add("hide");
            navBarSpacer.classList.add("hide");
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
                document.getElementById("AboutMe_").classList.remove("showPage")

            // Show Current Page
            var page = document.getElementById(hashLocation + "_");
            page.classList.add("showPage");
            
            // Highlight Correct Button
            navBar.children[0].classList.remove("selected");
            var currIndex = -1;
            for (var i = 0; i < navBar.children.length; i++)
                if (navBar.children[i].getAttribute("value") === hashLocation)
                    currIndex = i;
            navBar.children[currIndex].classList.add("selected");
            document.getElementById("navBarCurrent").firstChild.textContent = navBar.children[currIndex].innerText;
            prevIndex = currIndex;

            // Loads subDomain
            if (subDomain != "") {
                var validSubdomain = false;
                page.children[2].children[0].classList.remove("selected");
                for (var i = 0; i < page.children[2].children.length; i++) {
                    var filterHash = page.children[2].children[i].getAttribute("hash");
                    if (filterHash == subDomain) {
                        page.children[2].children[i].classList.add("selected");
                        subDomain = page.children[2].children[i].innerText;
                        validSubdomain = true;
                    }
                }
                if (!validSubdomain) {
                    page.children[2].children[0].classList.add("selected");
                    subDomain = "";
                }
            }

            //Set as Selected
            pageOpened(navBar.children[currIndex].getAttribute("value"), subDomain);
        }
        // Incorrect Load
        else {
            document.location.hash = '';
            pageOpened("AboutMe");
        }
    }
    else
        pageOpened("AboutMe");

    window.addEventListener("scroll", () => scrollResponse());
    scrollResponse();
});

function pageOpened(pageTitle, info) {
    switch (pageTitle) {
        case "AboutMe":
            document.getElementById("aboutMeFrame").src = "https://www.youtube.com/embed/FheamLV15RM";
            break;
        case "Programming":
            loadProjectsTable(0, info);
            break;
        case "Engineering":
            loadProjectsTable(1, info);
            break;
    }
}

// Overlay functions
var overlayNum = 0;
function showOverlay(showId, anchor) {
    if (!document.getElementById(showId).classList.contains("show")) {
        document.getElementById(showId).onclick = function(e) {showOverlay(showId)};
        document.getElementById(showId).classList.add("show");
        // Anchor Element to Self
        if (anchor != null) {
            var rect = anchor.getBoundingClientRect();
            document.getElementById(showId).children[0].style.top = rect.bottom + "px";
            document.getElementById(showId).children[0].style.left = rect.left + "px";            
        }
        overlayNum++;
    }
    else {
        document.getElementById(showId).classList.remove("show");
        // Disable Video just in case
        if (document.getElementById("galleryImage"))
            document.getElementById("galleryImage").children[1].src = "";
        overlayNum--;
        if (overlayNum == 0)
            document.body.style.overflowY = "auto";
    }
}

// Nav Button Sticky Header
var banner = null;
var navBar = null;
var shortNavBar = null;
var navBarSpacer = null;
function scrollResponse() {
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
}

// Nav Button Selection
var prevIndex = 0;
function showPage(self) {

    //Do extra code per page
    pageOpened(self.getAttribute("value"));

    // Scroll to Top
    if (window.scrollY >= banner.clientHeight + 20)
        window.scrollTo(0, banner.clientHeight + 20);

    var index = [...self.parentElement.children].indexOf(self);
    if (index != prevIndex) {
        var prevPage = null;
        var currPage = null;

        // Hide Previous Selection
        navBar.children[prevIndex].classList.remove("selected");
        prevPage = document.getElementById(navBar.children[prevIndex].getAttribute("value") + "_");
        setTimeout(() => {prevPage.classList.remove("showPage")}, 250);

        // Show Current Selection
        navBar.children[index].classList.add("selected");
        var pageName = self.getAttribute("value");
        currPage = document.getElementById(pageName + "_");
        currPage.classList.add("showPage");

        // Store Location Name
        document.location.hash = pageName;
        document.getElementById("navBarCurrent").firstChild.textContent = self.innerText;

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
function dropdownShowPage(self) {
    showPage(self);
}

// Engineering Code
function showGallery(self) {
    // Show Video
    if (self.hasAttribute("youtube")) {
        var src;
        if (self.getAttribute("youtube") == "local") {
            src = self.style.backgroundImage.substring(5, self.style.backgroundImage.length - 7) + ".mp4";
            var insertIndex = src.lastIndexOf("/");
            src = src.slice(0, insertIndex) + "/videos" + src.slice(insertIndex);
        }
        else
            src = self.getAttribute("youtube");
        document.getElementById("galleryImage").children[1].src = src;
        document.getElementById("galleryImage").children[0].style.display = "none";
        document.getElementById("galleryImage").children[1].style.display = "inherit";
        showOverlay("galleryImage");
        document.body.style.overflowY = "hidden";
    }
    // Show Image
    else {
        document.getElementById("galleryImage").children[0].src = "";
        setTimeout(() => {
            var src = self.style.backgroundImage.substring(5, self.style.backgroundImage.length - 2);
            src = src.substring(0, src.lastIndexOf('/')) + "/fullres" + src.substring(src.lastIndexOf('/'));
            document.getElementById("galleryImage").children[0].src = src;
            document.getElementById("galleryImage").children[0].style.display = "inherit";
            document.getElementById("galleryImage").children[1].style.display = "none";
            showOverlay("galleryImage");
            document.body.style.overflowY = "hidden";
        }, 100);
    }
}

//Show Gallery called from Programming Pages
window.showGalleryCall = function(src, video) {
    if (video) {
        document.getElementById("galleryImage").children[1].src = src;
        document.getElementById("galleryImage").children[0].style.display = "none";
        document.getElementById("galleryImage").children[1].style.display = "inherit";
        showOverlay("galleryImage");
        document.body.style.overflowY = "hidden";
    }
    else {
        document.getElementById("galleryImage").children[0].src = "";
        setTimeout(() => {
            document.getElementById("galleryImage").children[0].src = src;
            document.getElementById("galleryImage").children[0].style.display = "inherit";
            document.getElementById("galleryImage").children[1].style.display = "none";
            showOverlay("galleryImage");
            document.body.style.overflowY = "hidden";
        }, 100);
    }
}

//No fullres option
function reloadGalleryImage(self) {
    self.src = self.src.substring(0, self.src.lastIndexOf('/') - 8) + self.src.substring(self.src.lastIndexOf('/'));
}

function openLink(link) {
    window.open(link, '_blank');
}