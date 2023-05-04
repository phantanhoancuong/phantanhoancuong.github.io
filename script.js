document.addEventListener('DOMContentLoaded', function() {
  // Get references to the HTML elements
  var video = document.getElementById('video');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var canvasTemp = document.createElement('canvas');
  var contextTemp = canvasTemp.getContext('2d');

  // Set up event listeners, start processing frames
  video.addEventListener('play', function() {
    // Set the canvas sizes to match the video size
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    canvasTemp.width = video.clientWidth;
    canvasTemp.height = video.clientHeight;

    // Start processing the video frames
    draw(video, context, contextTemp, canvas.width, canvas.height);
  }, false);
}, false);

// Function to process frames
function draw(video, canvasContext, contextTemp, canvasWidth, canvasHeight) {
  // Check if the video is playing
  if (video.paused || video.ended) return false;

  // Request the next frame (make sure it's being processed continuously)
  requestAnimationFrame(function() {
    draw(video, canvasContext, contextTemp, canvasWidth, canvasHeight);
  });

  // Draw the frame onto the temporary canvas
  // Process the newly added frame on the temporary canvas
  contextTemp.drawImage(video, 0, 0, canvasWidth, canvasHeight);
  var imageData = contextTemp.getImageData(0, 0, canvasWidth, canvasHeight);
  var processedFrame = edgeDetection(imageData);

  // Display the processed frame on the main canvas
  canvasContext.putImageData(processedFrame, 0, 0);
}

// Function to apply filter for edge detection
function edgeDetection(imageData) {

  // Get the frame's dimensions and pixel data
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Create a new array to store the output frame's data
  const processedFrame = new Uint8ClampedArray(data.length);

  // Define the kernel
  const LoGFilter = [
    [0, 0, -1, 0, 0],
    [0, -1, -2, -1, 0],
    [-1, -2, 16, -2, -1],
    [0, -1, -2, -1, 0],
    [0, 0, -1, 0, 0]
  ];
  const kSize = LoGFilter.length;
  const kRadius = Math.floor(kSize / 2);

  // Iterate over each pixel that falls inside the frame
  for (let y = kRadius; y < height - kRadius; y++) {
    for (let x = kRadius; x < width - kRadius; x++) {
      // Current pixel
      // Initialize the sum
      const i = (y * width + x) * 4;
      let sum = 0;

      // Iterate over each pixel in the kernel
      for (let fy = 0; fy < kSize; fy++) {
        for (let fx = 0; fx < kSize; fx++) {
          const fi = ((y + fy - kRadius) * width + (x + fx - kRadius)) * 4;
          const weight = LoGFilter[fy][fx];
          sum += weight * data[fi];
        }
      }

      // Clip the new value [0, 255]
      // Apply the new value accordingly to all 3 channels
      // Alpha channel is always 255
      let pixelValue = Math.min(255, Math.max(0, sum));
      for (let byteIndex = 0; byteIndex < 3; byteIndex++) {
        processedFrame[i + byteIndex] = pixelValue;
      }
      processedFrame[i + 3] = 255;
    }
  }
  return new ImageData(processedFrame, width, height);
}