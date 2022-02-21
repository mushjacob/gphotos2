<template>
  <div id="app" :class="{slideshowView: slideshowMode, lightMode: album != null && (album.category == 'Proposals' || album.category == 'Weddings')}">
    <div id="nav_container" :class="{noShow: slideshowMode}" @click="goHome()">
          <img id="logo" ref="logo" class="noShow" src="./assets/logo.png" @load="fadeINLogo"/>
    </div>
    <landing-page ref="landingpage" :isMobile="isMobile" :albumError="albumError" :album="album" @coverphotoLoaded="coverphotoLoaded = true" @coverphotoError="noScroll = true" @passwordEntered="requestPwAlbum"></landing-page>
    <slideshow v-if="album != null && album.photos != null" ref="slideshow" :isMobile="isMobile" :likesList="likesList" :liked="liked" :slideshowMode="slideshowMode" :album="album" @exitSlideshow="exitSlideShowCallback"></slideshow>
    <photos v-if="album != null && album.photos != null && album.highlights != null" ref="photos" :isMobile="isMobile" :album="album" :likesList="likesList" :liked="liked" @likesUpdate="updateLikesList" @photosPreprocessed="photos_preprocessed" :slideshowMode="slideshowMode" :coverphotoLoaded="coverphotoLoaded" @photosLoaded="photosLoadedUpdate" @showSlideshow="startSlideshow"></photos>
  </div>
</template>

<script>
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import LandingPage from '@/components/LandingPage.vue'
import Photos from '@/components/Photos.vue'
import Slideshow from '@/components/Slideshow.vue'
import $ from 'jquery'
import { debounce } from "debounce";
import _ from 'lodash';

export default {
  name: 'Photography',
  components: {
    LandingPage,
    Photos,
    Slideshow
  },

  data() {
    return {
      isMobile: null,
      album: null,
      coverphotoLoaded: false,
      photosLoaded: 0,
      lastScroll: 0,
      scrolling: false,
      debounceScroll: null,
      debounceUpdateLandingPage: null,
      initialScrollDown: false,
      slideshowMode: false,
      updateLikesTimeout: null,
      liked: {},
      noScroll: false,
      likesList: {
        "add": {},
        "remove": {}
      },
      albumError: null,
      albumToken: null,
      localStorageTemplate: {
        likes: {},
        token: null
      }
    }
  },

  watch: { 
    slideshowMode: function(newVal) { // watch it
      if (newVal == true) {
        
        this.noScroll = true;
      } else {
        document.getElementById('photos').classList.remove("noDisplay");
        setTimeout(this.addNoDisplay, 1000);
        this.noScroll = false;
      }
    },

    noScroll: function(newVal) {
      if (newVal == true) {
        document.body.classList.add("noOverflow");
      } else {
        document.body.classList.remove("noOverflow");
      }
    },

    liked: function(newVal) {
      var savedData;
      try {
        savedData = JSON.parse(window.localStorage.getItem(`G_photography_${this.album.id}`));
      } catch {
        savedData = this.localStorageTemplate;
      }
      
      if (savedData == null) {
        savedData = this.localStorageTemplate;
      }
      if (!_.isEqual(newVal, savedData.likes)) {
        window.localStorage.setItem(`G_photography_${this.album.id}`, JSON.stringify({...savedData, likes: newVal}));
      }
    },

    albumToken: function(newVal) {
      if (newVal != null && this.album != null) {
        var savedData;
        try {
          savedData = JSON.parse(window.localStorage.getItem(`G_photography_${this.album.id}`));
        } catch {
          savedData = this.localStorageTemplate;
        }
        
        if (savedData == null) {
          savedData = this.localStorageTemplate;
        }

        if (newVal != savedData.token) {
          window.localStorage.setItem(`G_photography_${this.album.id}`, JSON.stringify({...savedData, token: newVal}));
        }

        window.history.replaceState(null, null, `?token=${newVal}`);
      }
    }
  },

  beforeCreate() {
    if (navigator.platform.toUpperCase().indexOf('WIN')>=0) {
      document.body.classList.add("customScrollBar");
    }

    let albumTitle = decodeURI(window.location.pathname.substring(1));

    if (this.albumTitle != "") {
      this.$http.post(`https://photography.gproductions.org/API/${albumTitle}`, {token: new URLSearchParams(window.location.search).get('token')}).then(response => {
        console.log(response);
        if (response.status == 200) {
          this.album = response.data;
          document.title = this.album.title;
          var savedData;
          try {
            savedData = JSON.parse(window.localStorage.getItem(`G_photography_${this.album.id}`));
          } catch {
            savedData = this.localStorageTemplate;
          }
          
          if (savedData == null) {
            savedData = this.localStorageTemplate;
          }
          this.liked = savedData['likes'];
        }
        else {
          this.albumError = "Error"
        }
        
      }).catch(e => {
        console.log(e);
        if (e.status == 401) {
          var album = e.data;
          var savedData;
          try {
            savedData = JSON.parse(window.localStorage.getItem(`G_photography_${album.id}`));
          } catch {
            savedData = this.localStorageTemplate;
          }
          
          if (savedData == null) {
            savedData = this.localStorageTemplate;
          }

          if (savedData.token != null) {
            this.requestPwAlbumWToken(album.title, savedData.token);
          } else {
            this.albumError = e.data.error;
            this.album = album;
            document.title = this.album.title;
            this.noScroll = true;
          }
          
        } else {
          this.albumError = e.bodyText;
          this.noScroll = true;
        }
      }).bind(this);
    }
    
  },

  created() {
    // eslint-disable-next-line no-useless-escape
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
        this.isMobile = true;
    }

    this.debounceScroll = debounce(function() {
      $('html, body').animate({
        scrollTop: $("#photos").offset().top
      }, 800, 'swing', this.turnOffScrolling);
    }, 800, true);

    this.debounceUpdateLandingPage = debounce(function(val) {
      this.$refs.landingpage.updatephotosLoaded(val);
    }, 30, true);

    window.onkeyup = this.keyupListener;
  },

  methods: {
    goHome() {
      window.open("https://gproductions.org/PHOTOGRAPHY", '_blank');
    },

    photos_preprocessed(val) {
      this.$refs.slideshow.photos_preprocessed(val);
    },

    addNoDisplay() {
      if (this.slideshowMode != true) {
        document.getElementById('slideshow').classList.add("noDisplay");
      }
    },

    startSlideshow(val) {
      document.getElementById('slideshow').classList.remove("noDisplay");
      document.getElementsByClassName('owl-stage')[0].classList.remove("noDisplay");
      setTimeout(this.startSlideshow2, 10, val);
      // setTimeout(function() {
      //   if (this.slideshowMode == true) {
      //     document.getElementById('photos').classList.add("noDisplay");
      //   }
      // }, 1000);
    },

    startSlideshow2(val) {
      this.$refs.slideshow.setPage(val);
      this.slideshowMode = true;
    },

    exitSlideShowCallback() {
      // document.getElementById('photos').classList.remove("noDisplay");
      setTimeout(this.exitSlideShow2, 10);
      
      setTimeout(this.exitSlideShow3, 1000);
    },

    exitSlideShow2() {
      this.slideshowMode = false;
    },

    exitSlideShow3() {
      if (this.slideshowMode == false) {
        document.getElementById('slideshow').classList.add("noDisplay");
        document.getElementsByClassName('owl-stage')[0].classList.add("noDisplay");
        // document.getElementById('ss_carousel').classList.add("noShow");
      }
    },

    requestPwAlbum(pw) {
      this.$http.post(`https://photography.gproductions.org/API/${this.album.id}`, {code: pw}).then(response => {
        if (response.status == 200) {
          var savedData;
          try {
            savedData = JSON.parse(window.localStorage.getItem(`G_photography_${this.album.id}`));
          } catch {
            savedData = this.localStorageTemplate;
          }
          
          if (savedData == null) {
            savedData = this.localStorageTemplate;
          }

          this.liked = savedData['likes'];
          this.albumToken = response.data.token;
          this.album.photos = response.data.photos;
          this.album.highlights = response.data.highlights;
          this.albumError = null;
          this.noScroll = false;
          setTimeout(this.startPreloadPhotos, 500);
        }
        else {
          this.albumError = "Error"
        }
        
      }).catch(e => {
        console.log(e);
        if (e.status == 401) {
          this.albumError = e.data.error;
        } else {
          this.albumError = e.bodyText;
        }
        
        this.noScroll = true;
      }).bind(this);
    },

    startPreloadPhotos() {
      this.$refs.photos.startPreload();
    },

    requestPwAlbumWToken(album_tile, token) {
      this.$http.post(`https://photography.gproductions.org/API/${album_tile}`, {token: token}).then(response => {
        if (response.status == 200) {
          this.album = response.data;
          document.title = this.album.title;
          this.albumToken = this.album.token;
          var savedData;
          try {
            savedData = JSON.parse(window.localStorage.getItem(`G_photography_${this.album.id}`));
          } catch {
            savedData = this.localStorageTemplate;
          }
          
          if (savedData == null) {
            savedData = this.localStorageTemplate;
          }
          this.liked = savedData['likes'];
        }
        else {
          this.albumError = "Error"
        }
        
      }).catch(e => {
        console.log(e);
        if (e.status == 401) {
          this.albumError = e.data.error;
          this.album = e.data;
          document.title = this.album.title;
        } else {
          this.albumError = e.bodyText;
        }
        this.noScroll = true;
      }).bind(this);
    },

    fadeINLogo() {
      this.$refs.logo.classList.remove("noShow");
    },

    keyupListener(e) {
      var key = e.code;
      if (this.slideshowMode) {
        if (key == "ArrowRight") {
          this.$refs.slideshow.incrementPage(1);
        }
        else if (key == "ArrowLeft") {
          this.$refs.slideshow.incrementPage(-1);
        }
        else if (key == "Escape") {
          this.slideshowMode = false;
        }
      }
      
    },

    photosLoadedUpdate(val) {
      // this.debounceUpdateLandingPage(val);
      this.$refs.landingpage.updatephotosLoaded(val);
      if (!this.initialScrollDown && val >= 1) {
        document.getElementById('app').classList.add('photosLoaded');
        this.initialScrollDown = true;
        // setTimeout(()=> {
        //   $('html, body').animate({
        //     scrollTop: $("#photos").offset().top
        //   }, 1000)
        // }, 1000);
        
        // setTimeout(() => {window.addEventListener("scroll", this.scrollHandler);}, 3000);
        setTimeout(function() {
          document.getElementById('loadpage').classList.add("noShow")
        }, 500);
        setTimeout(function() {
          document.getElementById('loadpage').classList.add("noDisplay")
        }, 2000);
      }
    },

    updateLikesList(like_obj) {
      let opposite;
      if (like_obj.action == "add") {
        opposite = "remove";
        if (like_obj.id in this.liked) {
          return;
        }
      } else {
        opposite = "add";
      }

      if (this.likesList[opposite][like_obj.id]) {
        delete this.likesList[opposite][like_obj.id];
        return;
      } 
      else if (like_obj.action == "add" && like_obj.id in this.liked) {
        return;
      }
      else if (like_obj.action == "remove" && !(like_obj.id in this.liked)) {
        return;
      }
      else {
        this.likesList[like_obj.action][like_obj.id] = like_obj.index;
        if (this.updateLikesTimeout == null) {
          this.updateLikesTimeout = setTimeout(this.updateLikes, 2000);
        }
      }
    },

    updateLikes() {
      var updatedLikesList = JSON.parse(JSON.stringify(this.likesList));
      var formData = {
        album_id: this.album.id,
        add: Object.keys(updatedLikesList.add),
        remove: Object.keys(updatedLikesList.remove)
      }

      if (this.albumToken != null) {
        formData.token = this.albumToken
      }

      this.$http.post(`https://photography.gproductions.org/API/like`, formData).then(response => {
        var likedPhotos = Object.keys(updatedLikesList.add);
        var unlikedPhotos = Object.keys(updatedLikesList.remove);
        var updatedLikedList = JSON.parse(JSON.stringify(this.liked));
        for (let photo_id of unlikedPhotos) {
          delete updatedLikedList[photo_id];
          delete updatedLikesList.remove[photo_id];
        }
        for (let photo_id of likedPhotos) {
          updatedLikedList[photo_id] = this.likesList.add[photo_id];
          delete updatedLikesList.add[photo_id];
        }
        this.liked = updatedLikedList;
        this.likesList = updatedLikesList;
        this.updateLikesTimeout = null;
      }).bind(this);
    },

    scrollHandler() {
      var photosElem = document.getElementById('photos');
      if (!this.scrolling && window.scrollY < photosElem.offsetTop && window.scrollY > this.lastScroll) {
          // $('html, body').animate({
          //   scrollTop: $(".photos").offset().top
          // }, 800)
          this.scrolling = true;
          this.debounceScroll();
      }

      this.lastScroll = window.scrollY;
    },

    turnOffScrolling() {
      setTimeout(() => {this.scrolling = false;}, 1000);
    }
  }
}
</script>

<style>
@font-face { font-family: albumTitle; src: url('/gfonts/album_title.ttf'); }
@font-face { font-family: helvetica_neue; src: url('/gfonts/Helvetica Neue UltraLight.ttf'); }
@font-face { font-family: helvetica_bold; src: url('/gfonts/Helvetica-Bold-Font.ttf'); }
@font-face { font-family: codec_regular; src: url('/gfonts/Codec-Warm-Regular-trial.ttf'); }
@font-face { font-family: codec; src: url('/gfonts/Codec-Warm-Thin-trial.ttf'); }
@font-face { font-family: roboto; src: url('/gfonts/Roboto-Thin.ttf'); }
@font-face { font-family: helvetica_n; src: url('/gfonts/Helvetica Neue UltraLight.ttf'); }

/* html {
  scroll-behavior: smooth;
} */

.noShow {
  opacity: 0;
}

.slideshowView {
  background: black !important;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 3s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.1s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}


#app {
  background: black;
  overflow-x: hidden;
  margin: 0;
  overflow: hidden;
  transition: 1s;
}

.photosLoaded {
  min-height: 200vh;
}

#nav_container {
  position: fixed;
    bottom: 1%;
    left: 1%;
    height: 2.5vw;
    width: 2.5vw;
    filter: invert(1);
    z-index: 10;
    background: transparent;
    padding: 1rem;
    display: flex;
    border-radius: 50%;
    cursor: pointer;
    transition: 1s ease;
}

#logo {
      width: auto;
    max-width: 80%;
    height: auto;
    position: relative;
    margin: auto;
    transition: 1s opacity ease 2s;
}

.lightMode {
  background: linear-gradient(90deg, #dddddd, #ffffff) !important;
  /* background: white !important; */
}

.noOverflow {
  overflow: hidden !important;
}

.noDisplay {
  display: none !important;
}

/* width */
.customScrollBar::-webkit-scrollbar {
	width: 3px;
	height: 4px;
	scrollbar-width: 3px;
  background: black;
}

.customScrollBar::-webkit-scrollbar-corner {
	background: black;
}
  
  /* Track */
.customScrollBar::-webkit-scrollbar-track {
	border-radius: 3px;
}
  
  /* Handle */
.customScrollBar::-webkit-scrollbar-thumb {
	background: rgb(194, 194, 194);
}

@media only screen and (min-width: 481px) and (max-width: 2000px) {
  #nav_container {
    width: 3.6vw !important;
    height: 3.6vw !important;
  }
}

@media (max-width:481px) {
  #nav_container {
    width: 14vw !important;
    height: 14vw !important;
  }
}

</style>
