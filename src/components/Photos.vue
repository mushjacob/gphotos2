<template>
  <div id="photos" :class="{noShow: !coverphotoLoaded}">
    <!-- <nav id="nav">
      <div id="nav_container2" :class="{noShow: slideshowMode}" @click="goHome()">
          <img id="logo" ref="logo" class="noShow" src="../assets/logo.png" @load="fadeINLogo"/>
    </div>
    <div id="nav_title">{{album != null ? album.title : ""}}</div>
    </nav> -->
    <div class="highlights">
      <div id="carousel_container">
          <carousel id="carousel" :class="{noBorderRadius: album != null && (album.category != 'Proposals' || album.category != 'Weddings')}" :perPage="1" :autoplay="loadedPhotos >= preLoadNum" :loop="true" :paginationActiveColor="'#FFFFFF'" :paginationColor="'#DEDEDE'" :autoplayTimeout="4000" :autoplayHoverPause="true">
              <template v-for="highlight in album.highlights">
                  <slide :key="highlight.id">
                    <img :class="{centerLongImage: isMobile && highlight.width < highlight.height}" :src="`${highlight.url}=w${Math.floor(getCarouselWidth() * 0.5)}`" />
                    <div class="like_thumbnail" v-if="highlight.likes > 0">
                      <b-icon icon="heart-fill" scale="1"></b-icon>
                      <div class="like_num_highlights">{{highlight.likes}}</div>
                    </div>
                  </slide>
              </template>
          </carousel>
      </div>
    </div>

    <div id="photos_list" ref="photos_list" class="tenwayView" v-if="album.photos != null && photos_preprocessed != false">
      <div class="img_row" v-for="row in Math.ceil(album.photos.length/columnNum)" :style="`min-height: calc(((100vw * ${photos_sizes[(row - 1) * columnNum]}) / ${album.photos[(row - 1) * columnNum].width}) * ${album.photos[(row - 1) * columnNum].height});`" :key="row">
        <template v-for="column in checkTenwayWidth(row - 1)">
          <div class="img_container" @click="$emit('showSlideshow', column)" v-if="column < album.photos.length" v-observe-visibility="(column >= preloadTriggerMultiple && column % preloadTriggerMultiple == 0) ? preLoadTrigger : false" :aria-index="column" :key="'IMG_' + column" :style="`width: ${(photos_sizes[column] * 100)}% !important; height: auto !important; min-height: inherit;`">
              <img class="img noShow lazy-load" @load="imageLoaded(column)" data-placeholder-background="whitesmoke" :data-src="album.photos[column].url + '=w' + Math.floor(parseInt(photos_sizes[column] * ((!isMobile) ? windowWidth : windowWidth * 3)))">
              <div class="img_actions" v-if="!isMobile">
                <b-icon class="fullscreen_btn" icon="fullscreen" :scale="(!isMobile) ? 1.3 : 1" @click="$emit('showSlideshow', column)" aria-hidden="true"></b-icon>
                <b-icon class="download_btn" icon="download" :scale="(!isMobile) ? 1.3 : 1" @click="downloadImg(column, $event)" aria-hidden="true"></b-icon>
                <div class="like_btn" :aria-index="column" @click="likeBtnClick(column, $event)">
                  <b-icon icon="heart" :class="{noShow: photoIsLiked(column)}" :scale="(!isMobile) ? 1.3 : 1" aria-hidden="true"></b-icon>
                  <b-icon icon="heart-fill" :class="{noShow: photoIsNotLiked(column)}" style="color: #ff2692" :scale="(!isMobile) ? 1.3 : 1" aria-hidden="true"></b-icon>
                  <div class="like_num" :class="{noShow: noShowPhotoNum(column)}">{{album.photos[column].likes}}</div>
                </div>
              </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { Carousel, Slide } from 'vue-carousel';
import $ from 'jquery'
import lcm from 'compute-lcm'
import lozad from 'lozad'
import ScrollReveal from 'scrollreveal'

export default {
  name: 'Photos',

  components: {
    Carousel,
    Slide
  },

  props: {
    isMobile: Boolean,
    album: Object,
    coverphotoLoaded: Boolean,
    slideshowMode: Boolean,
    likesList: Object,
    liked: Object
  },

  data() {
    return {
        slide: 0,
        sliding: null,
        windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        preLoadNum: 200,
        loadedPhotos: 0,
        columnNum: 3,
        preloadTriggerMultiple: 100,
        photos_sizes: [],
        photos_preprocessed: false
    }
  },

  watch: { 
    coverphotoLoaded: function(newVal) { // watch it
      if (newVal == true) {
        this.startPreload();
      }
    },
  },

  created() {
    window.addEventListener('resize', function () { this.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth });

    if (this.album != null && this.album.photos != null) {
      this.photos_sizes = Array.apply(null, Array(this.album.photos.length));
      this.preLoadNum = Math.floor(this.album.photos.length/2);
      var columnNum_tmp = this.columnNum;
      if (this.album.photos.length > 300) {
        this.columnNum = !this.isMobile ? 8 : 5;
        columnNum_tmp = !this.isMobile ? 8 : 5;
        this.preloadTriggerMultiple = !this.isMobile ? 400 : 200;
      }

      for (let row=0; row<Math.ceil(this.album.photos.length/columnNum_tmp); row++) {
        let el_imgs = []
        for (let x=row*columnNum_tmp; x<(row*columnNum_tmp)+columnNum_tmp; x++) {
          if (this.album.photos.length > x) {
            let the_img = this.album.photos[x];
            the_img.the_index = x;
            el_imgs.push(the_img);
          } else {
            break;
          }
        }

        if (el_imgs.length == 1) {
          this.photos_sizes[el_imgs[0].the_index] = 0.33;
          continue;
        }

        let totalWidth = 1;

        for (let img of el_imgs) {
          img.nheight = Math.floor(img.height * 0.33);
          img.nwidth = Math.floor(img.width * 0.33);
        }

        var img_heights = el_imgs.map(x => x.nheight);

        var lcm_val = lcm(img_heights);

        var total_newWidth = 0;
        for (let img of el_imgs) {
          img.factor1 = lcm_val/img.nheight;
          img.newWidth = img.factor1 * img.nwidth;
          total_newWidth += img.newWidth;
        }

        let windowWidth = window.innerWidth * totalWidth;

        let factor2 = windowWidth/total_newWidth;

        for (let img of el_imgs) {
          this.photos_sizes[img.the_index] = ((img.newWidth * factor2)/windowWidth).toFixed(4);
        }
      }
      this.photos_preprocessed = true;
      this.$emit('photosPreprocessed', this.photos_sizes);
    }
  },

  mounted() {
    let elmts = document.querySelectorAll(".lazy-load");
    window.img_observer = lozad(elmts, {
      loaded: this.lozadLoaded
    });
    window.img_observer.observe();
    if (this.isMobile) {
      ScrollReveal().reveal('.img_row', { reset: false });
    } else {
      if (window.innerWidth > 2000) {
        ScrollReveal().reveal('.img_row', { reset: true, distance: '30px',origin: 'bottom' });
      } else {
        ScrollReveal().reveal('.img_row', { reset: false });
      }
    }
    
    
  },

  methods: {
    downloadImg(index, e) {
      e.stopPropagation();
      window.open(this.album.photos[index].url + '=d', '_blank');
    },

    fadeINLogo() {
      this.$refs.logo.classList.remove("noShow");
    },

    photoIsLiked(index) {
      return this.liked[this.album.photos[index].id] != null;
    },

    photoIsNotLiked(index) {
      return this.liked[this.album.photos[index].id] == null;
    },

    noShowPhotoNum(index) {
      return this.album.photos[index].likes <= 0;
    },

    likeBtnClick(index, e) {
      e.stopPropagation();
      let elem = document.querySelector(`.like_btn[aria-index="${index}"`);
      let svgs = elem.getElementsByTagName('svg');
      let like_num = elem.getElementsByClassName('like_num')[0];
      var like_obj = {id: this.album.photos[index].id, index: index};

      if (svgs[1].classList.contains("noShow")) {
        like_obj.action = "add";
        svgs[1].classList.remove("noShow");
        svgs[0].classList.add("noShow");
        this.album.photos[index].likes += 1;
        like_num.classList.remove("noShow");
      } else {
        like_obj.action = "remove";
        svgs[0].classList.remove("noShow");
        svgs[1].classList.add("noShow");
        if (this.album.photos[index].likes > 0) {
          this.album.photos[index].likes -= 1;
        }
      }
      this.$emit('likesUpdate', like_obj);
    },

    startPreload() {
      let preLoad = [].slice.call(document.querySelectorAll('.lazy-load'));

      if (preLoad.length > this.preLoadNum) {
        preLoad = preLoad.splice(0, this.preLoadNum);
      }

      for (let elem of preLoad) {
        window.img_observer.triggerLoad(elem);
      }
    },

    lozadLoaded(el) {
      el.classList.remove('noShow');
      if (this.album.category == 'Proposals' || this.album.category == 'Weddings') {
        el.parentElement.classList.add('white');
      } else {
        el.parentElement.classList.add('black');
      }
      
      this.loadedPhotos += 1;
      // console.log("LOADED PHOTOS: " + this.loadedPhotos + " | " + this.preLoadNum);
      if (this.loadedPhotos <= this.preLoadNum) {
        this.$emit('photosLoaded', this.loadedPhotos/this.preLoadNum);
      }
    },

    preLoadTrigger(isVisible, entry) {
      if (isVisible) {
        let elem = entry.target;
        let index = parseInt(elem.getAttribute('aria-index'));

        let preLoad = [].slice.call(document.querySelectorAll('.lazy-load'));
        if (index + 1 < preLoad.length) {
          preLoad = preLoad.splice(index+1);
          if (preLoad.length > this.preLoadNum) {
            preLoad = preLoad.splice(0, this.preLoadNum);
          }

          for (let elem of preLoad) {
            window.img_observer.triggerLoad(elem);
          }
        }
        
      }

    },

    getImgSrc(url) {
      if (!this.isMobile) {
        const width  = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return `${url}=w${width}`;
      } else {
        const height = window.innerHeight|| document.documentElement.clientHeight|| document.body.clientHeight;
        return `${url}=w${height}`;
      }
    },

    getCarouselTranslateY(highlight) {
      let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      let factor = (width * 0.5)/highlight.width;
      let newHeight = factor * highlight.height;
      let height = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) * 0.5;
      let innerHeight = height * 0.9;
      let leftover = newHeight - innerHeight;
      let returnVal = ((leftover/2)/height * 100).toFixed(2);
      return returnVal;
    },

    getCarouselWidth() {
      let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
      if (this.isMobile) {
        width *= 3;
      }
      return width;
    },

    imageLoaded(e) {
      var elem = e.target;
      $(elem).removeClass("noShow");
    },

    calculateTenWayWidth(row) {
      let el_imgs = []
      for (let x=row*this.columnNum; x<(row*this.columnNum)+this.columnNum; x++) {
        if (this.album.photos.length > x) {
          let the_img = this.album.photos[x];
          the_img.the_index = x;
          el_imgs.push(the_img);
        }
      }

      let totalWidth = 1;

      for (let img of el_imgs) {
        img.nheight = Math.floor(img.height * 0.33);
        img.nwidth = Math.floor(img.width * 0.33);
      }

      var img_heights = el_imgs.map(x => x.nheight);

      var lcm_val = lcm(img_heights);

      var total_newWidth = 0;
      for (let img of el_imgs) {
        img.factor1 = lcm_val/img.nheight;
        img.newWidth = img.factor1 * img.nwidth;
        total_newWidth += img.newWidth;
      }

      let windowWidth = window.innerWidth * totalWidth;

      let factor2 = windowWidth/total_newWidth;

      for (let img of el_imgs) {
        this.album.photos[img.the_index].threewayWidth = ((img.newWidth * factor2)/windowWidth).toFixed(4);
      }
    },

    checkTenwayWidth: function(row) {
      let index = row * this.columnNum;
      if (!this.photos_sizes[index]) {
        this.calculateTenWayWidth(row);
      }

      var columns = [];
      for (let x=index; x<index+this.columnNum; x++) {
        columns.push(x);
      }
      return columns;
    }
  }
}
</script>

<style scoped>

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

.black {
  background: black !important;
}

.white {
  background: white !important;
}

#photos {
  display: block;
  transition: 0.6s ease;
  width: 100vw;
  max-width: 100vw;
}

.hidePhotos {
  /* transform: translateX(-101vw); */
  /* filter: blur(2rem); */
}

.highlights {
    width: 100vw;
    padding-bottom: 6rem;
    padding-top: 7rem;
}

#nav {
    position: absolute;
    z-index: 1000;
    top: 0;
    width: 100vw;
    height: 3vh;
    background: rgba(0,0,0,1);
    text-align: center;
    vertical-align: middle;
    color: white;
    font-family: inherit;
    font-size: 1rem;
    box-shadow: 0 0.1rem 0.5rem rgb(0 0 0 / 90%);
    display: flex;
    /* border-radius: 1rem; */
    background: transparent;
    -webkit-backdrop-filter: blur(1rem);
    backdrop-filter: blur(1rem);
    background: black;
}

#nav_container2 {
  filter: invert(1);
    width: auto;
    height: auto;
    margin: auto;
    margin-left: 2rem;
    margin-right: 0;
    width: 1.5rem;
}

#nav_title {
  margin: auto;
  letter-spacing: 2px;
  font-weight: bold;
  font-size: 1rem;
  margin-left: 2rem;
  font-family: helvetica_n;
  -webkit-font-smoothing: auto;
}

#logo {
    margin: auto;
    width: 2rem;
}

#carousel_container {
    width: 100%;
    display: flex;
}

#carousel {
    width: 50vw;
    height: 60vh;
    margin: auto;
    border-radius: 2rem;
}

#photos_list {
  position: relative;
  width: 100%;
  margin: auto;
}

#photos_list_title {
  /* font-family: helvetica_bold; */
}

.img_row {
  display: flex;
  height: fit-content;
}

.img{
    width: -webkit-fill-available;
    /* height: inherit; */
    border-radius: 0px;
    -webkit-transition: all 0.5s, opacity 0.5s linear 0.5s;
    transition: all 0.5s, opacity 0.5s linear 0.5s;
    flex-shrink: 0;
    min-height: inherit;
    /* border-radius: 0.5rem; */
}

.noShow {
  opacity: 0;
}

.VueCarousel-slide {
  height: 100%;
  position: relative;
  overflow: hidden;
}


.img_actions {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: fit-content;
  clear: both;
  opacity: 0;
  transition: 0.5s ease-out;
  /* -webkit-background-clip: text; */
  --gradient-progress: -51%;
  --gradient-progress-2: 80%;
  --gradient-angle: 0deg;
  --gradient-color: 20;
  --gradient-color-2: 240;
  --gradient-opacity: 1;
  --gradient-opacity-2: 0;
  background-image: linear-gradient(var(--gradient-angle), rgba(var(--gradient-color), var(--gradient-color), var(--gradient-color), var(--gradient-opacity)) var(--gradient-progress), rgba(var(--gradient-color-2), var(--gradient-color-2), var(--gradient-color-2), var(--gradient-opacity-2)) var(--gradient-progress-2));
  background-repeat: repeat-y;
  padding-bottom: 0.5rem;
  padding-right: 0.5rem;
}

.img_actions svg {
  position: relative;
  color: white;
  float: right;
  padding: 1.8rem;
  transition: all 0.3s, opacity 0.3s ease;
  /* opacity: 0; */
}

.like_num {
  color: white;
    /* position: absolute; */
    /* top: 0%; */
    /* top: 50%; */
    /* transform: translateY(-50%); */
    grid-column: 2;
    grid-row: 1;
    margin: auto;
    transform: translateY(20%);
}

/* .download_btn {
  float: left !important;
} */

/* .img_actions svg:hover {
  transform: scale(1.3);
} */

.download_btn:hover {
  transform: scale(1.3);
}

.fullscreen_btn:hover { 
  transform: scale(1.3);
}

.img_container:hover .img_actions {
  opacity: 1;
}

.img_container {
  position: relative;
  margin-bottom: 1px;
  background: whitesmoke;
  /* margin-bottom: 0.1rem; */
  /* border-radius: 0.5rem; */
  margin-right: 1px;
}

.img_container:first-child {
  /* margin-right: 1px; */
}

.img_container:last-child {
  margin-right: 0px;
}

.like_btn {
  display: grid;
  float: right;
  transition: 0.3s;
  cursor: pointer;
}

.like_btn svg {
  grid-column: 1;
  grid-row: 1;
}

.like_btn:hover {
  transform: scale(1.3)
}

.like_thumbnail {
  color: white;
    position: absolute;
    bottom: 1%;
    right: 2%;
    display: inline-flex;
    z-index: 1000;
}

.like_thumbnail svg {
  position: relative;
  margin: 1rem;
  margin-right: 0.5rem;
  filter: drop-shadow(0px 0px 3px rgba(0,0,0,0.3));
}

.like_num_highlights {
  color: inherit;
    font-size: 1rem;
    position: relative;
    margin: auto;
    text-shadow: 0 0 0.5rem rgb(0 0 0 / 90%);
}

@media only screen and (min-width: 481px) and (max-width: 2000px) {
  .highlights {
    padding-bottom: none !important;
    padding-top: 3rem !important;
  }

  #carousel {
    width: 40vw !important;
    height: 44vh !important;
  }
}

.noBorderRadius {
  border-radius: 0 !important;
}

@media (min-width:481px) {
  .VueCarousel-slide img {
    min-width: 100%;
    position: absolute;
    top: -9999px;
    bottom: -9999px;
    left: -9999px;
    right: -9999px;
    margin: auto;
    min-height: 100%;
    height: auto;
  }

}

@media (max-width:481px) {
  .VueCarousel-slide img {
    position: relative !important;
    min-height: 100% !important;
    min-width: 100% !important;
    max-width: unset !important;
    height: auto !important;
    width: auto !important;
    flex-shrink: 0 !important;
  }

  .VueCarousel-slide {
    width: auto !important;
    height: auto !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    overflow: hidden !important;
  }

  .light_mode_photos {
    box-shadow: 1rem 0rem 3rem rgb(0 0 0 / 30%);
  }

  .like_thumbnail {
    color: white;
    position: absolute;
    bottom: 20%;
    right: 2%;
    display: inline-flex;
    z-index: 1000;
  }

}

.centerLongImage {
  top: 50% !important;
  transform: translateY(-50%) !important;
}

</style>

<style>
.carousel-inner {
    /* border-radius: 2rem !important; */
}

.VueCarousel-inner {
    height: inherit !important;
}

#carousel_container .VueCarousel-wrapper {
    border-radius: 1rem;
    box-shadow: 0 0 1rem rgb(0 0 0 / 50%);
    width: 100%;
    height: -webkit-fill-available;
    min-height: 100%;
    position: relative;
    overflow: hidden;
}

.noBorderRadius .VueCarousel-wrapper {
  border-radius: 0 !important;
}

@media (max-width:481px) {
  #carousel_container .VueCarousel-wrapper {
    border-radius: 0.3rem !important;
    height: auto !important;
    max-height: inherit !important;
  }

  #carousel {
    width: 90vw !important;
    height: auto !important;
    max-height: 45vh !important;
  }

  .VueCarousel-inner {
      height: inherit !important;
      max-height: inherit !important;
  }

}
</style>
