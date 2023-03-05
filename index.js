window.addEventListener("load", function () {
    var fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", onChangeFileInput);
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

const gaussianFilter = (size, variance) => {
    const gaussian = new Array(size).fill(null).map(() => new Array(size).fill(null));
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const x = i - center;
            const y = j - center;
            const exponent = -(x * x + y * y) / (2 * variance * variance);
            gaussian[i][j] = Math.exp(exponent);
            sum += gaussian[i][j];
        }
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            gaussian[i][j] /= sum;
        }
    }

    console.log(gaussian);
    return gaussian;
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

        /*
        convulateAndAppendInCanvas("border-detection-canvas", [
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, 24, -1, -1],
            [-1, -1, -1, -1, -1],
            [-1, -1, -1, -1, -1],
        ]);

        convulateAndAppendInCanvas("neatness-amelioration-canvas", [
            [0, -1, 0],
            [-1, 5, -1],
            [0, -1, 0],
        ]);

        convulateAndAppendInCanvas("box-blur-canvas", [
            [1 / 9, 1 / 9, 1 / 9],
            [1 / 9, 1 / 9, 1 / 9],
            [1 / 9, 1 / 9, 1 / 9],
        ]);
        */

        convulateAndAppendInCanvas("gaussian-blur-canvas", gaussianFilter(35, 30));
    };
    img.src = URL.createObjectURL(file);
};

const convulateAndAppendInCanvas = (destinationCanvasId, convulationMatrix) => {
    var originalImageCanvas = document.getElementById("original-image-canvas");
    var originalImageContext = originalImageCanvas.getContext("2d");

    var convulatedImageData = convulate(
        originalImageContext.getImageData(0, 0, originalImageCanvas.width, originalImageCanvas.height),
        convulationMatrix
    );

    var convulatedImageCanvas = document.getElementById(destinationCanvasId);
    var convulatedImageContext = convulatedImageCanvas.getContext("2d");

    convulatedImageCanvas.width = convulatedImageData.width;
    convulatedImageCanvas.height = convulatedImageData.height;

    convulatedImageContext.clearRect(0, 0, convulatedImageData.width, convulatedImageData.height);
    convulatedImageContext.putImageData(convulatedImageData, 0, 0);
};

const generationConvulationMatrix = () => {
    /*
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
    */

    var convulationMatrix = [
        [-1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1],
        [-1, -1, 24, -1, -1],
        [-1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1],
    ];

    return convulationMatrix;
};

const convulate = (imageData, convulationMatrix) => {
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

// Function that create a gaussian filter matrix with random variance
const generateGaussianFilter = (size, variance) => {
    const matrix = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => Math.floor(Math.random() * 100))
    );
    return scaleConvulationMatrixToMatchSumOne(matrix);
};
