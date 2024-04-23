import React from "react";
import Slider from "react-slick";
import planetData from "../planetData";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function ImageSlider() {
  const images = planetData.map((planet) => planet.image);
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div>
      <Slider {...settings}>
        {images.map((image, index) => {
          return (
            <div key={index}>
              <img src={image} alt={`planet ${index}`} />
            </div>
          );
        })}
      </Slider>
    </div>
  );
}

export default ImageSlider;
