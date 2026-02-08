
// Main JS Functions

var pageTitles = ["Who Am I?", "Programming", "Engineering", "YouTube", "Don't Press!"];

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
            var page = document.getElementById(hashLocation + "_");
            page.classList.add("showPage");
            
            // Highlight Correct Button
            document.getElementById("navBar").children[0].classList.remove("selected");
            var currIndex = pageTitles.findIndex((title) => title.replaceAll(' ', '') === hashLocation);
            document.getElementById("navBar").children[currIndex].classList.add("selected");
            document.getElementById("navBarCurrent").firstChild.textContent = pageTitles[currIndex] + " ";
            prevIndex = currIndex;

            // Loads subDomain
            if (subDomain != "") {
                for (var i = 0; i < page.children[2].children.length; i++) {
                    page.children[2].children[i].classList.remove("selected");
                    var bttnText = page.children[2].children[i].children[0].innerText;
                    if (bttnText.replaceAll(" ", "").replaceAll("/", "") == subDomain) {
                        page.children[2].children[i].classList.add("selected");
                        subDomain = bttnText.replaceAll(" / ", "");
                    }
                }
            }

            //Set as Selected
            pageOpened(currIndex, subDomain);
            if (isPorfolio)
                pageOpened(0);
        }
        // Incorrect Load
        else {
            document.location.hash = '';
            pageOpened(0);
        }
    }
    else
        pageOpened(0);

    window.addEventListener("scroll", () => scrollResponse());
    scrollResponse();

    setupFavoriteVideos();
});

function pageOpened(pageNumber, info) {
    switch (pageNumber) {
        case 0:
            document.getElementById("aboutMeFrame").src = "https://www.youtube.com/embed/M6HiwVCEiQA";
            loadAboutMe();
            break;
        case 1:
            loadProjectsTable(0, info);
            break;
        case 2:
            loadProjectsTable(1, info);
            break;
        case 4:
            randomPressed();
            break;
    }
}

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
        if (document.getElementById("galleryImage"))
            document.getElementById("galleryImage").children[1].src = "";
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
function showPage(index) {

    //Do extra code
    pageOpened(index);

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
    }
    // Show Image
    else {
        var src = self.style.backgroundImage.substring(5, self.style.backgroundImage.length - 2);
        src = src.substring(0, src.lastIndexOf('/')) + "/fullres" + src.substring(src.lastIndexOf('/'));
        document.getElementById("galleryImage").children[0].src = src;
        document.getElementById("galleryImage").children[0].style.display = "inherit";
        document.getElementById("galleryImage").children[1].style.display = "none";
    }
    showOverlay("galleryImage");
    document.body.style.overflowY = "hidden";
}

//No fullres option
function reloadGalleryImage(self) {
    self.src = self.src.substring(0, self.src.lastIndexOf('/') - 8) + self.src.substring(self.src.lastIndexOf('/'));
}

//Unfortunately manual setup but oh well
function setupFavoriteVideos() {
    var videoInfo = ["How I Became the #1 Living Tombstone Fan!", "liyx33umy78",
        "[Conquer the Tree] Now Released on AirConsole.com!", "9XybB5iKBDs",
        "How I Created my First Robot!", "M6HiwVCEiQA",
        "[VRS] A Virtual Robot Simulator for FTC!", "HvywykxdrBU",
        "Devlog - Swinging Like Spiderman!", "pgUL1RheLG4",
        "250 Subscriber S̴p̷e̴c̵̱̓i̵̖̊ḁ̸̈ḻ̷͇̉!̵͚̣̿̔", "K8w44mNalI0",
        "Making a 3D Plants vs. Zombies Augmented Reality Game!", "rU2_OTNgbO0",
        "Scrolling RPG Dialogue System in Vanilla Minecraft!", "UCEZmEWEHOY",
        "[ TRULY EXCELLENT. ] Deltacraft - Deltarune in Minecraft Java Edition", "XXp-lb8CZ7w",
        "[Villain REWIND] I Made a Cool Game out of Nowhere??", "p2JFJR0HKDA",
        "Realistic Water in Minecraft?", "DklCVXgwtDg",
        "Working TNT Yeeter!", "zhM8zV9gDYY",
        "[Space Fighters!] A New Shoot Em' Up Game", "0KUQqyvHXVk",
        "SHOW YOURSELF DELTACRAFT! - Deltarune in Minecraft Bedrock Edition", "ucubTxwIqGM",
        "[Abenteuer] The BETA is FINISHED!", "7Lj53xyhhSA",
        "Bedrock Commands - Creating a 2D Game: First Demo!", "mMm0U7JsQPo",
        "Minecraft - Rainbow Six Siege Project!", "Eydxh8v-vNU",
        "Minecraft Bedrock - Making My Very Own GAME SHOW!", "xTIYSt-OpFg",
        "My Five Night's At Freddy's Mod!", "ZkBx7dQK9BE",
        "My First Bedrock Redstone Contraption! - Triangular Piston Door!", "pE4xGnBATzU",
        "I made Snake, a Memory Game, and Pong on my TI-84 Calculator!", "bsU8hg-PrxA",
        "Lego Elf on the Shelf!", "RZlHjFEPytI"];

    var playlistElement = document.getElementById("MyBestPlaylist");

    //Add odds then evens
    for (var i = 0; i < videoInfo.length / 2; i += 2) {
        addVideo(videoInfo[i * 2], videoInfo[i * 2 + 1]);
    }

    playlistElement.appendChild(document.createElement("br"));

    for (var i = 1; i < videoInfo.length / 2; i += 2) {
        addVideo(videoInfo[i * 2], videoInfo[i * 2 + 1]);
    }
    
    //Setup scrolling
    playlistElement.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent default vertical scrolling

        // Adjust the scroll amount based on deltaY (mouse wheel direction)
        playlistElement.scrollLeft += event.deltaY;
    });
}

function addVideo(videoTitle, videoLink) {
    //Thumbnail
    var newVideo = document.createElement("div");
    newVideo.style.backgroundImage = "url('./assets/sprites/youtube/" + videoTitle.replaceAll('#', '').replaceAll('?', '').replaceAll("'", '').replaceAll(':', '') + ".webp')";

    //Link
    newVideo.setAttribute("youtube", "https://www.youtube.com/embed/" + videoLink + "?list=PLszFVnnZcmaopY7no2EGotH84xF_lQEoG");
    newVideo.onclick = function() { showGallery(this); }

    //Title
    var title = document.createElement("div");
    title.innerText = videoTitle;
    newVideo.appendChild(title);

    //Play Bttn
    //newVideo.appendChild(document.getElementById("playBttn").cloneNode(true));

    document.getElementById("MyBestPlaylist").appendChild(newVideo);
}