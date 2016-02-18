/**
 * Created by lucheng0902 on 2016/2/14.
 */
//console.log(123);
(function () {
    var PageInit = (function () {
        return {
            init: function () {
                this.bindEvent();
            },
            bindEvent:function(){
                var swiper = new Swiper('.swiper-container', {
                    direction: 'vertical',
                    slidesPerView: 1,
                    initialSlide: 0,
                    paginationClickable: true,
                    mousewheelControl: true,
                    onSlideChangeEnd: function (swiper) {
                        console.log(swiper);
                        //swiper外侧容器
                        var $wrapper = swiper.wrapper;
                        console.log($wrapper);
                        //当前索引
                        var activeIndex = swiper.activeIndex;
                        //所有页面
                        var slides = swiper.slides;
                        //当前滑块
                        var activeSlide = slides.eq(activeIndex);
                        console.log(activeIndex);
                        console.log(activeSlide);

                        //paper页面处理
                        var $pagePaper = $wrapper.find(".page-paper");
                        if ($pagePaper.length > 0) {
                            $pagePaper.removeClass("page-paper-down");
                        }
                        //当前如果是
                        if (activeSlide.hasClass("page-paper-box")) {
                            setTimeout(function () {
                                $pagePaper.removeClass("page-paper-down").addClass("page-paper-down");
                            }, 3000);
                        }
                        //祝福页重置class
                        (function () {
                            var $wishSlide = $wrapper.find(".page-wish");
                            var $mask = $wishSlide.find(".mask");
                            var $shareTip = $wishSlide.find(".shareTip");

                            if ($mask.length > 0) {
                                $mask.removeClass("addMask");
                            }
                            if ($shareTip.length > 0) {
                                $shareTip.removeClass("addShareTip");
                            }
                        })();


                    }
                });

                //点击分享
                $(document).on('tap', '.shareBtn', function () {
                    $(".page7 .mask").removeClass("addMask").addClass("addMask");
                    $(".page7 .shareTip").removeClass("addShareTip").addClass("addShareTip");
                });
            },
            render: function () {
                console.log("pageInit render");
                console.log("pageInit change");
            }
        }
    })();
    PageInit.init();
})();