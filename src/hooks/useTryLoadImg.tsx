import { useState, useEffect } from "react";

const useTryLoadImg = (imgSrc: string) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const tryLoad = new Image();
    tryLoad.src = imgSrc;
    tryLoad.onerror = () => {
      setHasError(true);
    };
    tryLoad.onload = () => {
      setHasError(false);
    };
  }, [imgSrc]);

  return hasError;
};

export default useTryLoadImg;
