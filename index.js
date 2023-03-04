window.addEventListener("load", function () {
    var fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", onChangeFileInput);

    var goConvulateButton = document.getElementById("blur-matrix-button");
    goConvulateButton.addEventListener("click", goConvulate);
});

const scaleConvulationMatrixToMatchSumOne = (convulationMatrix) => {
    var sum = 0;
    for (var i = 0; i < convulationMatrix.length; i++) {
        for (var j = 0; j < convulationMatrix[i].length; j++) {
            sum += convulationMatrix[i][j];
        }
    }

    for (var i = 0; i < convulationMatrix.length; i++) {
        for (var j = 0; j < convulationMatrix[i].length; j++) {
            convulationMatrix[i][j] /= sum;
        }
    }

    return convulationMatrix;
};

const onChangeFileInput = (event) => {
    // Get file
    var file = event.target.files[0];
    console.log(file);

    var originalImageCanvas = document.getElementById("original-image-canvas");
    var originalImageContext = originalImageCanvas.getContext("2d");
    originalImageContext.clearRect(0, 0, originalImageCanvas.width, originalImageCanvas.height);

    // Draw original image
    var img = new Image();
    img.onload = function () {
        var loadedImageWidth = img.width;
        var loadedImageHeight = img.height;

        originalImageCanvas.width = loadedImageWidth;
        originalImageCanvas.height = loadedImageHeight;

        var scale_factor = Math.min(
            originalImageCanvas.width / loadedImageWidth,
            originalImageCanvas.height / loadedImageHeight
        );

        var newWidth = loadedImageWidth * scale_factor;
        var newHeight = loadedImageHeight * scale_factor;

        var x = originalImageCanvas.width / 2 - newWidth / 2;
        var y = originalImageCanvas.height / 2 - newHeight / 2;

        originalImageContext.drawImage(img, x, y, newWidth, newHeight);
    };
    img.src = URL.createObjectURL(file);
};

const goConvulate = () => {
    var originalImageCanvas = document.getElementById("original-image-canvas");
    var originalImageContext = originalImageCanvas.getContext("2d");

    var convulatedImageData = convulate(
        originalImageContext.getImageData(0, 0, originalImageCanvas.width, originalImageCanvas.height)
    );

    var convulatedImageCanvas = document.getElementById("convulated-image-canvas");
    var convulatedImageContext = convulatedImageCanvas.getContext("2d");

    convulatedImageCanvas.width = convulatedImageData.width;
    convulatedImageCanvas.height = convulatedImageData.height;

    convulatedImageContext.clearRect(0, 0, convulatedImageData.width, convulatedImageData.height);
    convulatedImageContext.putImageData(convulatedImageData, 0, 0);
};

const convulate = (imageData) => {
    const minSize = 20;
    const maxSize = 25;
    var convulationMatrixSize = Math.floor(Math.random() * (maxSize - minSize + 1) + minSize);
    if (convulationMatrixSize % 2 === 0) convulationMatrixSize += 1;
    console.log(convulationMatrixSize);

    var convulationMatrix = scaleConvulationMatrixToMatchSumOne(
        Array.from({ length: convulationMatrixSize }, () =>
            Array.from({ length: convulationMatrixSize }, () => Math.floor(Math.random() * 100))
        )
    );

    var newImageData = new ImageData(imageData.width, imageData.height);

    for (var y = 0; y < imageData.height; y++) {
        for (var x = 0; x < imageData.width; x++) {
            var computedPixelIndex = (y * imageData.width + x) * 4;
            var computedPixel = getComputedPixel(imageData, computedPixelIndex);
            var convulationMatrixCefficientToRecover = 0;

            for (var i = 0; i < convulationMatrix.length; i++) {
                for (var j = 0; j < convulationMatrix[i].length; j++) {
                    var index =
                        ((y - (i - (convulationMatrix.length - 1) / 2)) * imageData.width +
                            (x + (j - (convulationMatrix.length - 1) / 2))) *
                        4;
                    var pixel = getPixel(imageData, index);

                    var convulationMatrixCefficient = convulationMatrix[i][j];
                    if (pixel === undefined) {
                        convulationMatrixCefficientToRecover += convulationMatrixCefficient;
                        continue;
                    }

                    computedPixel.computed_r += convulationMatrixCefficient * pixel.r;
                    computedPixel.computed_g += convulationMatrixCefficient * pixel.g;
                    computedPixel.computed_b += convulationMatrixCefficient * pixel.b;
                    computedPixel.computed_a += convulationMatrixCefficient * pixel.a;
                }
            }

            if (convulationMatrixCefficientToRecover !== 0) {
                computedPixel.computed_r += convulationMatrixCefficientToRecover * computedPixel.r;
                computedPixel.computed_g += convulationMatrixCefficientToRecover * computedPixel.g;
                computedPixel.computed_b += convulationMatrixCefficientToRecover * computedPixel.b;
                computedPixel.computed_a += convulationMatrixCefficientToRecover * computedPixel.a;
            }

            setPixel(newImageData, computedPixelIndex, computedPixel);
        }
    }

    return newImageData;
};

const getPixel = (imageData, index) => {
    return imageData.data[index]
        ? {
              r: imageData.data[index],
              g: imageData.data[index + 1],
              b: imageData.data[index + 2],
              a: imageData.data[index + 3],
          }
        : undefined;
};

const getComputedPixel = (imageData, index) => {
    return {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3],
        computed_r: 0,
        computed_g: 0,
        computed_b: 0,
        computed_a: 0,
    };
};

const setPixel = (imageData, index, pixel) => {
    imageData.data[index] = pixel.computed_r;
    imageData.data[index + 1] = pixel.computed_g;
    imageData.data[index + 2] = pixel.computed_b;
    imageData.data[index + 3] = 255;
};
