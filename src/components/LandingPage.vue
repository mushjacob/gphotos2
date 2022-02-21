<template>
  <div id="loadpage" :class="{light_mode: album != null && (album.category == 'Proposals' || album.category == 'Weddings')}">
    <div id="background" ref="background" :class="{blur: coverphotoLoaded, noShow: noShowCoverphoto, fixedBackground: !noShowCoverphoto && album != null && album.category != 'Proposals' && album.category != 'Weddings'}">
      <!-- <img class="img noShow" :src="getImgSrc(album.coverphoto.url)" @load="imageLoaded"/> -->
    </div>
    <div id="center_container">
      <div id="albumTitle_container" :class="{cursive_font: album != null && (album.category == 'Proposals' || album.category == 'Weddings'), default_font: album != null && (album.category != 'Proposals' && album.category != 'Weddings')}" v-if="album != null && (coverphotoLoaded || coverphotoError)">
        <div id="albumTitle" ref="albumTitle" style="background-size: 0% 100%">
          {{album.title}}
        </div>
        <div id="albumTitle2" ref="albumTitle2" :class="{white: albumError != null || (coverphotoError && album != null && album.category != 'Proposals' && album.category != 'Weddings'), smooth_trans: albumError != null || coverphotoError}">
          {{album.title}}
        </div>
      </div>
    </div>
    <div id="center_container2" v-if="coverphotoError || albumError">
      <div id="error_msg" :class="{white: albumError != null || (coverPhotoError && album == null || (album != null && album.category != 'Proposals' && album.category != 'Weddings'))}">{{getErrorMessage()}}</div>
    </div>
    <transition name="fade2">
      <div id="center_container3" v-if="coverphotoError == false && album != null && albumError != null" >
        <!-- <b-form-input id="input_pw" v-model="password_input" type="password" placeholder="Enter password"></b-form-input> -->
        <md-field id="input_pw" :class="{show: coverphotoLoaded}">
          <label>Enter password</label>
          <md-input v-model="password_input" type="password" @keyup.enter.native="pwEntered"></md-input>
        </md-field>
      </div>
    </transition>
  </div>
</template>

<script>

export default {
  name: 'LoadPage',
  props: {
    isMobile: Boolean,
    album: Object,
    albumError: String
  },

  data() {
    return {
      coverphotoSrc: "",
      noShowCoverphoto: true,
      coverphotoLoaded: false,
      coverphotoError: false,
      photosLoaded: 0,
      password_input: "",
    }
  },

  watch: { 
    album: function(newVal, oldVal) { // watch it
      if (newVal != null && oldVal == null) {
        this.coverphotoSrc = this.getImgSrc(newVal.coverphoto.url);
        var image = new Image();
        image.addEventListener('load', this.imageLoaded);
        image.addEventListener('error', this.coverPhotoError)
        image.src = this.coverphotoSrc;

        
      }
    }
  },

  created() {
    if (this.album != null) {
      this.coverphotoSrc = this.getImgSrc(this.album.coverphoto.url);
      var image = new Image();
      image.addEventListener('load', this.imageLoaded);
      image.addEventListener('error', this.coverPhotoError)
      image.src = this.coverphotoSrc;
    }
    
  },

  methods: {
    getImgSrc(url) {
      if (!this.isMobile) {
        const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return `${url}=w${width}`;
      } else {
        const height  = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        return `${url}=h${height * 2}`;
      }
    },

    pwEntered() {
      this.$emit('passwordEntered', this.password_input);
    },

    getErrorMessage() {
      if (this.coverphotoError) {
        return "Album unavailable. Please refresh the page"
      }
      if (this.album != null && this.albumError) {
        return `${this.albumError}. Please enter password`;
      }
    },

    coverPhotoError() {
      this.coverphotoError = true;
      this.$emit('coverphotoError');
    },

    updatephotosLoaded(val) {
      this.photosLoaded = val;
      try {
        this.$refs.albumTitle.style = `background-size: ${(this.photosLoaded * 100).toFixed(2)}% 100%`;
      } catch(err) {
        console.log(err);
      }
      
      if (val >= 1 && !this.$refs.albumTitle2.classList.contains("noShow")) {
        setTimeout(function() {
          document.getElementById('albumTitle2').classList.add("noShow");
        }, 2000)
      }
    },

    imageLoaded() {
      var clickedElement = this.$refs.background;
      clickedElement.style.backgroundImage = `url("${this.coverphotoSrc}")`
      setTimeout(() => { this.noShowCoverphoto=false; }, 500);
      setTimeout(() => { this.coverphotoLoaded=true; }, 1200);
      setTimeout(() => { this.$emit('coverphotoLoaded', true); }, 4500);
    },
  }
}
</script>


<style scoped>

@keyframes fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}

/* Firefox < 16 */
@-moz-keyframes fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}

/* Safari, Chrome and Opera > 12.1 */
@-webkit-keyframes fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}

/* Internet Explorer */
@-ms-keyframes fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}

/* Opera < 12.1 */
@-o-keyframes fadein {
    from { opacity: 0; }
    to   { opacity: 1; }
}

.fade2-enter-active, .fade2-leave-active {
  transition: opacity 0.5s;
}
.fade2-enter, .fade2-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

#loadpage {
  background: black;
  width: 100vw;
  height: 100vh;
  position: fixed;
  transition: 1s ease;
  z-index: 100000;
}

.light_mode {
  background: transparent !important;
}

#albumTitle_container {
  margin: auto;
  -webkit-animation: fadein 1s; /* Safari, Chrome and Opera > 12.1 */
       -moz-animation: fadein 1s; /* Firefox < 16 */
        -ms-animation: fadein 1s; /* Internet Explorer */
         -o-animation: fadein 1s; /* Opera < 12.1 */
            animation: fadein 1s;
}

.cursive_font {
  font-family: albumTitle !important;
  font-size: 2rem !important;
}

.default_font {
  font-family: helvetica_neue !important;
  font-size: 3rem !important;
  letter-spacing: 6px !important;
}

.white {
  color: white !important;
}

#albumTitle2 {
  font-family: inherit;
  font-size: inherit;
  padding: 5rem;
  color: black;
  cursor: default;
}

.smooth_trans {
  transition: 1s ease;
}

#albumTitle {
  font-family: inherit;
  font-size: inherit;
  padding: 5rem;
  color: transparent;
  cursor: default;
  position: absolute;
  background-clip: text;
  font-weight: bold;
  transition: 0.2s ease-out;
  -webkit-background-clip: text;
  --gradient-progress: 90%;
  --gradient-progress-2: 100%;
  --gradient-angle: 90deg;
  --gradient-color: 255;
  --gradient-color-2: 240;
  --gradient-opacity: 1;
  --gradient-opacity-2: 0;
  background-image: linear-gradient(var(--gradient-angle), rgba(var(--gradient-color), var(--gradient-color), var(--gradient-color), var(--gradient-opacity)) var(--gradient-progress), rgba(var(--gradient-color-2), var(--gradient-color-2), var(--gradient-color-2), var(--gradient-opacity-2)) var(--gradient-progress-2));
  background-repeat: repeat-y;
}

#center_container {
  display: flex;
  position: relative;
  width: 100%;
  height: 100%;
}

#background {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  -webkit-transition: filter 3s linear, opacity 1s ease-out;
  -moz-transition: filter 3s linear, opacity 1s ease-out;
  -o-transition: filter 3s linear, opacity 1s ease-out;
  transition: filter 3s linear, opacity 1s ease-out;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.fixedBackground {
  background-attachment: fixed;
}

.blur {
  filter: blur(10px);
}

.noShow {
  opacity: 0;
}

#error_msg {
  position: relative;
  /* bottom: 20%; */
  color: black;
  margin: auto;
  top: 47%;
}

#center_container2 {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  display: flex;
  -webkit-animation: fadein 1s; /* Safari, Chrome and Opera > 12.1 */
       -moz-animation: fadein 1s; /* Firefox < 16 */
        -ms-animation: fadein 1s; /* Internet Explorer */
         -o-animation: fadein 1s; /* Opera < 12.1 */
            animation: fadein 1s;
}


#center_container3 {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  display: flex;
  -webkit-animation: fadein 1s; /* Safari, Chrome and Opera > 12.1 */
       -moz-animation: fadein 1s; /* Firefox < 16 */
        -ms-animation: fadein 1s; /* Internet Explorer */
         -o-animation: fadein 1s; /* Opera < 12.1 */
            animation: fadein 1s;
}

#input_pw {
    width: 8vw;
    height: calc(5vw * 0.3);
    margin: auto;
    top: 10%;
    position: relative;
    opacity: 0;
    transition: opacity 1s ease-out;
}

.show {
  opacity: 1 !important;
}

@media only screen and (min-width: 481px) and (max-width: 2000px) {
  #albumTitle2 {
    font-size: 1.5rem !important;
  }

  #albumTitle {
    font-size: 1.5rem !important;
  }
}

@media (max-width:481px) {
  #albumTitle2 {
    font-size: 2rem !important;
    width: 100% !important;
    margin: auto !important;
  }

  #albumTitle {
    font-size: 2rem !important;
    width: 100% !important;
    margin: auto !important;
    font-weight: 400 !important;
    transition: 0.5s ease-out !important;
    --gradient-progress: 80% !important;
  }

  .light_mode #albumTitle2 {
    font-size: 1rem !important;
  }

  .light_mode #albumTitle {
    font-size: 1rem !important;
  }

  #input_pw {
    width: 38vw !important;
    top: 8% !important;
  }

  #background {
    background-repeat: unset !important;
    background-size: unset !important;
    width: 100%;
    height: 100vh !important;
    background-position: center center !important;
  }

  #albumTitle_container {
    margin-top: 50% !important;
  }

}

</style>

<style>
.md-theme-default label {
  color: rgba(255,255,255,0.5) !important;
  left: 50% !important;
  transform: translateX(-50%);
  width: fit-content;
}

.md-theme-default input {
  -webkit-text-fill-color: white !important;
  text-align: center;
    width: inherit;
}

.md-theme-default:after {
  background-color: rgba(255,255,255,0.5) !important;
}

.md-theme-default::before {
  background-color: white !important;
}

.md-field.md-theme-default.md-focused .md-input {
  color: white !important;
}

.md-field.md-has-password .md-toggle-password {
  display: none;
}
</style>