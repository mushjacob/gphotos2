<template>
  <div id="slideshow" :class="{reveal: slideshowMode == true}">
      <div id="ss_carousel_container">
          <!-- <carousel id="ss_carousel" :perPage="1" :adjustableHeight="true" :value="slideshow_index" @page-change="pageChange" :centerMode="true" :scrollPerPage="false" :paginationEnabled="false" :adjustableHeightEasing="'ease'" :autoplay="false" :loop="false">
              <template v-for="(photo, index) in album.photos">
                  <slide :key="photo.id">
                    <div class="ss_img_container">
                        <img :id="`img_${index}`" class="noShow" v-if="index < 10" :src="getPhotoUrl(photo)" @load="imageLoaded(index)"/>
                        <img :id="`img_${index}`" class="noShow" v-if="index >= 10" :data-src="getPhotoUrl(photo)" @load="imageLoaded(index)"/>
                    </div>
                  </slide>
              </template>
          </carousel> -->

          <carousel id="ss_carousel" :class="{noShow: carousel_translated != true}" v-if="photos_sizes != null" @translated="carouselTranslated" :items="1" :center="true" :lazyLoad="true" :lazyLoadEager="10" :loop="true" :dots="true" :nav="false" :fluidSpeed="350" :smartSpeed="350"  @changed="pageChange">
              <template v-for="(photo, index) in album.photos">
                    <div class="ss_img_container" :key="photo.id">
                        <!-- <img :id="`img_${index}`" class="noShow" v-if="index < 10" :src="getPhotoUrl(photo)" @load="imageLoaded(index)"/> -->
                        <img :id="`img_${index}`" class="noShow owl-lazy" :class="{horizontal_img: photo.width >= photo.height, vertical_img: photo.width < photo.height}" :data-src="getPhotoUrl(index)" @load="imageLoaded(index)"/>
                    </div>
              </template>
          </carousel>
      </div>
      <div id="slideshow_actions_container">
          <div id="slideshow_actions" :class="{light_mode_color: album != null && (album.category == 'Proposals' || album.category == 'Weddings')}">
              <b-icon class="return_to_btn btn" v-b-tooltip.hover title="Exit fullscreen" @click="exitSlideshow" icon="x" :scale="icon_scale + 0.5" aria-hidden="true"></b-icon>
              <b-icon class="prev_btn btn" v-b-tooltip.hover title="Previous photo" @click="incrementPage(-1)" icon="chevron-left" :scale="icon_scale" aria-hidden="true"></b-icon>
              <div id="current_text_container">{{(slideshow_index + 1) + "/" + album.photos.length}}</div>
              <b-icon class="next_btn btn" v-b-tooltip.hover title="Next photo" @click="incrementPage(1)" icon="chevron-right" :scale="icon_scale" aria-hidden="true"></b-icon>
              <b-icon class="download_btn btn" v-b-tooltip.hover title="Download" @click="downloadImg" icon="download" :scale="icon_scale" aria-hidden="true"></b-icon>
              
              <div id="ss_likes_container">
                <div class="ss_like_btn" ref="ss_like_btn" @click="likeBtnClick">
                    <b-icon icon="heart" :class="{noShow: (liked[album.photos[slideshow_index].id] != null || likesList.add[album.photos[slideshow_index].id] != null) && likesList.remove[album.photos[slideshow_index].id] == null}" style="width: 100%; margin: auto;" :scale="icon_scale" aria-hidden="true"></b-icon>
                    <b-icon icon="heart-fill" :class="{noShow: (likesList.add[album.photos[slideshow_index].id] == null && liked[album.photos[slideshow_index].id] == null) || likesList.remove[album.photos[slideshow_index].id] != null}" style="color: #ff2692; width: 100%; margin: auto; margin-left: -100%;" :scale="icon_scale" aria-hidden="true"></b-icon>
                </div>
                <div class="like_num">{{album.photos[slideshow_index].likes}}</div>
              </div> 
          </div>
      </div>
  </div>
</template>

<script>
// import { Carousel, Slide } from 'vue-carousel';
import carousel from 'vue-owl-carousel';

export default {
  name: 'Slideshow',
  components: {
    // Carousel,
    // Slide
    carousel
  },

  props: {
    isMobile: Boolean,
    album: Object,
    slideshowMode: Boolean,
    likesList: Object,
    liked: Object
  },

  data() {
    return {
        slideshow_index: 0,
        icon_scale: 1.2,
        photos_sizes: null,
        carousel_translated: false,
        first_click: true
    }
  },
  
  mounted() {
    document.getElementById('slideshow').classList.add("noDisplay");
    // document.getElementsByClassName('owl-stage')[0].classList.add("noDisplay");
    // document.getElementById('ss_carousel').classList.add("noShow");
  },
  
  methods: {
    login: function (event) {
      // `this` inside methods points to the Vue instance
      alert('Hello ' + this.name + '!')
      // `event` is the native DOM event
      if (event) {
        alert(event.target.tagName)
      }
    },

    exitSlideshow() {
        this.carousel_translated = false;
        this.$emit('exitSlideshow');
    },

    photos_preprocessed(val) {
        this.photos_sizes = val;
        setTimeout(function() {
            document.getElementsByClassName('owl-stage')[0].classList.add("noDisplay");
            document.getElementById('ss_carousel').classList.add("noShow");
        }, 1000)
    },

    likeBtnClick() {
      let svgs = this.$refs.ss_like_btn.getElementsByTagName('svg');
      var like_obj = {id: this.album.photos[this.slideshow_index].id, index: this.slideshow_index};
      if (svgs[1].classList.contains("noShow")) {
        like_obj.action = "add";
        svgs[1].classList.remove("noShow");
        svgs[0].classList.add("noShow");
        this.album.photos[this.slideshow_index].likes += 1;
      } else {
        like_obj.action = "remove";
        svgs[0].classList.remove("noShow");
        svgs[1].classList.add("noShow");
        if (this.album.photos[this.slideshow_index].likes > 0) {
          this.album.photos[this.slideshow_index].likes -= 1;
        }
      }
      this.$emit('likesUpdate', like_obj);
    },

    carouselTranslated() {
        // document.getElementById('ss_carousel').classList.remove("noShow");
        this.carousel_translated = true
    },

    downloadImg() {
        if (!this.isMobile) {
            window.open(this.album.photos[this.slideshow_index].url + '=d', '_blank');
        } else {
            window.open(this.album.photos[this.slideshow_index].url + '=d');
        }
        
    },

    pageChange(e) {
        var theIndex = e.page.index;
        this.slideshow_index = theIndex;
        var photo_url = null;
        

        var photo = this.album.photos[theIndex];
        if (photo.width > photo.height) {
            let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            if (this.isMobile) {
                width *= 3;
            }
            photo_url = `${photo.url}=w${width}`
        } else {
            let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            if (this.isMobile) {
                height *= 3;
            }
            photo_url = `${photo.url}=h${height}`
        }

        if (document.getElementById(`img_${theIndex}`).src != photo_url) {
            var image = new Image();
            image.addEventListener('load', function() {
                document.getElementById(`img_${theIndex}`).src = image.src;
            });
            image.src = photo_url;
        }
        

        let svgs = this.$refs.ss_like_btn.getElementsByTagName('svg');
        if (this.liked[this.album.photos[this.slideshow_index].id] != null || this.likesList.add[this.album.photos[this.slideshow_index].id] != null) {
            svgs[1].classList.remove("noShow");
            svgs[0].classList.add("noShow");
        } else {
            svgs[0].classList.remove("noShow");
            svgs[1].classList.add("noShow");
        }
    },

    preloadImgs(val) {
        var preload_ids = [val];
        if (val >= 5 && val < this.album.photos.length - 5) {
            for (let x=1; x<=5; x++) {
                preload_ids.push(val - x);
            }

            for (let x=1; x<=10; x++) {
                preload_ids.push(val + x);
            }
        } else if (val < 5) {
            for (let x=0; x<val; x++) {
                preload_ids.push(x);
            }

            for (let x=1; x<=10; x++) {
                preload_ids.push(val + x);
            }
        } else if (this.album.photos.length - 5 <= val) {
            for (let x=val+1; x<this.album.photos.length; x++) {
                preload_ids.push(x);
            }

            for (let x=1; x<=5; x++) {
                preload_ids.push(val - x);
            }
        }

        let elem = document.getElementById(`img_${val}`);
        let isLoaded = elem.getAttribute('src');
        // console.log(isLoaded);
        if (isLoaded == null || isLoaded == "") {
         elem.src = elem.getAttribute("data-src");
         elem.onload = function() {
             this.triggerPreLoads(preload_ids);
         }.bind(this);
        } else {
            this.triggerPreLoads(preload_ids);
        }

        
    },

    triggerPreLoads(preload_ids) {
        for (let preload of preload_ids) {
            let elem = document.getElementById(`img_${preload}`);
            let isLoaded = elem.getAttribute('src');
            // console.log(isLoaded);
            if (isLoaded != null && isLoaded != "") {
                continue;
            }

            elem.src = elem.getAttribute("data-src");
        }
    },

    imageLoaded(index) {
        document.getElementById(`img_${index}`).classList.remove("noShow");
    },

    incrementPage(val) {
        if (val == 1) {
            document.getElementsByClassName('owl-next')[0].click();
        } else {
            document.getElementsByClassName('owl-prev')[0].click();
        }
    },

    setPage(val) {
        if (val == this.slideshow_index || this.first_click == true) {
            this.carousel_translated = true;
            this.first_click = false;
        } else {
            this.carousel_translated = false;
        }
        document.getElementsByClassName('owl-dot')[val].click();
    },

    getPhotoUrl(index) {
        var photo = this.album.photos[index];
        var photo_size = this.photos_sizes[index];
        let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        return `${photo.url}=w${Math.floor(parseInt(photo_size * ((!this.isMobile) ? width : width * 3)))}`
        // if (photo.width > photo.height) {
        //     let width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        //     if (this.isMobile) {
        //         width *= 3;
        //     }
        //     return `${photo.url}=w${width}`
        // } else {
        //     let height = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        //     if (this.isMobile) {
        //         height *= 3;
        //     }
        //     return `${photo.url}=h${height}`
        // }

    },
  }
}
</script>

<style scoped>

@keyframes scale {
    0% {transform: scale(1.0);}
    50% {transform: scale(1.3);}
    100% {transform: scale(1.0);}
}

/* Firefox < 16 */
@-moz-keyframes scale {
    0% {transform: scale(1.0);}
    50% {transform: scale(1.3);}
    100% {transform: scale(1.0);}
}

/* Safari, Chrome and Opera > 12.1 */
@-webkit-keyframes scale {
    0% {transform: scale(1.0);}
    50% {transform: scale(1.3);}
    100% {transform: scale(1.0);}
}

/* Internet Explorer */
@-ms-keyframes scale {
    0% {transform: scale(1.0);}
    50% {transform: scale(1.3);}
    100% {transform: scale(1.0);}
}

/* Opera < 12.1 */
@-o-keyframes scale {
    0% {transform: scale(1.0);}
    50% {transform: scale(1.3);}
    100% {transform: scale(1.0);}
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}

#slideshow {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    display: -webkit-box;
    height: 100vh;
    opacity: 0;
    transition: 0.4s ease;
    z-index: 100;
    backdrop-filter: brightness(10%);
}

.reveal {
    opacity: 1 !important;
}

#ss_carousel_container {
    width: 100%;
    height: auto;
    display: flex;
    max-height: 95vh;
}

#ss_carousel {
    width: 75vw;
    height: auto;
    margin: auto;
    transition: 1s opacity ease;
}

.VueCarousel-slide {
    width: 75vw;
}

.VueCarousel-slide {
    width: 75vw;
    height: inherit;
}

.ss_img_container {
    padding: 2rem;
    width: inherit;
    height: inherit;
    display: grid;
    margin: 0 !important;
    /* position: relative; */
}

.ss_img_container img {
    width: auto;
    height: auto;
    /* max-height: 100% !important; */
    max-width: 90% !important;
    margin: auto;
    transition: all 1s, opacity 1s linear 1s;
    position: absolute;
    top: -9999px;
    bottom: -9999px;
    left: -9999px;
    right: -9999px;
    margin: auto;
    background: white;
}

.horizontal_img {
    width: 90% !important;
    height: auto !important;
}

.vertical_img {
    height: 90% !important;
    width: auto !important;
}

#slideshow_actions {
    display: flex;
    margin: auto;
    margin-top: 0;
    color: white;
}

.light_mode_color {
    color: white !important;
}

#slideshow_actions .btn {
    /* padding: 1rem; */
    margin: auto;
    border-radius: 50%;
    width: 8rem;
    height: 2rem;
    transition: 0.3s ease;
    cursor: pointer;
    color: inherit;
    /* filter: drop-shadow( 0 0 0.4rem rgba(0, 0, 0, .3)); */
}

#slideshow_actions_container {
    width: 100%;
    height: auto;
    display: -webkit-inline-box;
    position: absolute;
    bottom: 0;
    padding-bottom: 1rem;
    background: transparent;
}

.noShow {
  opacity: 0;
}

#current_text_container {
    cursor: default;
    display: block;
    text-align: center;
    vertical-align: center;
    margin: auto;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none;
    margin: auto;
    vertical-align: middle;
    text-align: center;
    margin: auto;
    color: inherit;
    width: 5vw;
    font-family: 'roboto';
    font-weight: 700;
}


.ss_like_btn {
    display: flex;
    transition: 0.3s ease;
    cursor: pointer;
    width: auto;
    height: 2rem;
    /* padding: 1rem; */
    margin: auto;
    color: inherit;
    padding-left: 2rem;
    /* filter: drop-shadow( 0 0 0.4rem rgba(0, 0, 0, .3)); */
}

.like_num {
    font-size: 0.8rem;
    margin: auto;
    padding-bottom: 0.3rem;
    width: 2vw;
    cursor: default;
    transition: 0.3s ease;
    font-family: 'roboto';
    font-weight: 700;
}

.ss_like_btn svg {
  transition: 0.3s ease;
}

#ss_likes_container {
    display: inherit;
}



@media (min-width:481px) {
    #ss_likes_container:hover .ss_like_btn {
        transform: scale(1.3);
    }

    #ss_likes_container:hover .like_num {
        transform: scale(1.3);
        transform: translateX(37%);
    }

    .btn:hover {
        transform: scale(1.3);
    }

    .ss_img_container img {
        box-shadow: 0 0 0.5rem rgb(0 0 0 / 93%);
    }
}

@media (max-width:481px) {
    .noDisplay {
        display: none !important;
    }

    #slideshow {
        display: grid !important;
    }

    #ss_carousel {
        width: 100vw !important;
        height: 80vh !important;
        margin: auto;
        margin-top: 1rem !important;
        transition: 1s opacity ease;
    }

    .ss_img_container {
        padding: 0.5rem !important;
    }

    #slideshow_actions .btn {
        width: auto !important;
        height: auto !important;
        padding: 1.3rem !important;
        border-radius: 0 !important;
    }

    #ss_carousel_container {
        height: 80vh !important;
        grid-column: 1 !important;
        grid-row: 1 !important;
        position: relative !important;
    }

    #slideshow_actions_container {
        width: 100vw !important;
        height: -webkit-fit-content !important;
        display: block !important;
        position: relative !important;
        bottom: 0 !important;
        left: 0 !important;
        padding-bottom: 6.3rem !important;
        grid-column: 1 !important;
        grid-row: 2 !important;
    }

    #slideshow_actions {
        display: flex;
        margin: auto;
        margin-top: 0;
        color: white;
        width: 80% !important;
        height: inherit !important;
    }

    #current_text_container {
        font-size: 0.75rem !important;
        width: inherit !important;
    }

    .ss_like_btn {
        display: flex;
        transition: 0.3s ease;
        cursor: pointer;
        width: -webkit-min-content !important;
        height: auto !important;
        /* padding: 1rem; */
        margin: auto;
        color: inherit;
        padding-left: 0rem !important;
        padding-right: 0rem !important;
        /* filter: drop-shadow( 0 0 0.4rem rgba(0, 0, 0, .3)); */
    }

    .like_num {
        width: 6vw !important;
        padding-left: 0.1rem !important;
        font-size: 0.75rem !important;
    }

    .ss_like_btn svg {
        width: auto !important;
    }

    #ss_likes_container:hover .ss_like_btn {
        animation: scale 0.3s;
    }

    #ss_likes_container:hover .like_num {
        animation: scale 0.3s;
    }

    .btn:hover {
        animation: scale 0.3s;
    }

    .ss_img_container img {
        box-shadow: unset !important;
    }

    #slideshow.noDisplay {
        display: none !important;
    }
    
}

</style>

<style>

.VueCarousel-wrapper {
    width: 100%;
    height: calc(75vw * 0.66);
    position: relative;
    overflow: hidden;
}

.owl-stage {
    height: calc(75vw * 0.66) !important;
}

.owl-item {
    height: inherit !important;
}

.owl-dots {
    display: none;
}

@media (max-width:481px) {
    .owl-stage {
        height: 80vh !important;
    }
}

</style>
