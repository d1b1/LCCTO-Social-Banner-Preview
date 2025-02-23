import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Draggable from 'react-draggable';
import { Download, Upload, X, Trash2, RotateCcw } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import WebFont from 'webfontloader';
import { RootState } from './store/store';
import {
  setTitle,
  setSubtitle,
  setTitleSize,
  setSubtitleSize,
  setBackgroundColor,
  setGradientColor,
  setImage,
  setImageSize,
  setImageShadow,
  setAspectRatio,
  setTextAlignment,
  setPadding,
  setTitleColor,
  setSubtitleColor,
  setTextWidth,
  setFontFamily,
  resetToDefault,
  ASPECT_RATIOS,
  type AspectRatioKey
} from './store/bannerSlice';

// Popular Google Fonts
const GOOGLE_FONTS = [
  'Arial',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Oswald',
  'Raleway',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Nunito',
  'PT Sans',
  'Quicksand'
];

function App() {
  const dispatch = useDispatch();
  const {
    title,
    subtitle,
    titleSize,
    subtitleSize,
    backgroundColor,
    gradientColor,
    image,
    imageSize,
    imageShadow,
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth,
    fontFamily
  } = useSelector((state: RootState) => state.banner);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filename, setFilename] = useState('BANNER');
  const [error, setError] = useState('');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showImageControls, setShowImageControls] = useState(false);

  useEffect(() => {
    // Load Google Fonts
    WebFont.load({
      google: {
        families: GOOGLE_FONTS
      }
    });
  }, []);

  const currentRatio = ASPECT_RATIOS[aspectRatio as AspectRatioKey];
  const scale = Math.min(
    800 / currentRatio.width,
    500 / currentRatio.height
  );

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual dimensions
    canvas.width = currentRatio.width;
    canvas.height = currentRatio.height;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, backgroundColor);
    gradient.addColorStop(1, gradientColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image if exists
    if (image && imageRef.current) {
      const img = imageRef.current;
      const aspectRatio = img.width / img.height;
      let drawWidth = imageSize;
      let drawHeight = drawWidth / aspectRatio;
      
      // Apply shadow if enabled
      if (imageShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 10;
      }
      
      ctx.drawImage(
        img,
        canvas.width - drawWidth - padding.left + imagePosition.x,
        (canvas.height - drawHeight) / 2 + imagePosition.y,
        drawWidth,
        drawHeight
      );

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Configure text settings
    ctx.textAlign = 'left';
    const maxWidth = canvas.width * (textWidth / 100);

    // Calculate text position based on alignment
    let textY;
    switch (textAlignment) {
      case 'top':
        textY = padding.top;
        break;
      case 'bottom':
        textY = canvas.height - padding.bottom - subtitleSize;
        break;
      default:
        textY = (canvas.height - (titleSize + subtitleSize + 20)) / 2;
    }

    // Draw title
    ctx.font = `bold ${titleSize}px ${fontFamily}`;
    ctx.fillStyle = titleColor;
    const titleLines = getTextLines(ctx, title, maxWidth);
    titleLines.forEach((line, index) => {
      ctx.fillText(line, padding.left, textY + (index * titleSize * 1.2));
    });

    // Draw subtitle
    ctx.font = `${subtitleSize}px ${fontFamily}`;
    ctx.fillStyle = subtitleColor;
    const subtitleY = textY + (titleLines.length * titleSize * 1.2) + 20;
    const subtitleLines = getTextLines(ctx, subtitle, maxWidth);
    subtitleLines.forEach((line, index) => {
      ctx.fillText(line, padding.left, subtitleY + (index * subtitleSize * 1.2));
    });
  };

  const getTextLines = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        imageRef.current = img;
        drawCanvas();
      };
    } else {
      drawCanvas();
    }
  }, [
    title,
    subtitle,
    titleSize,
    subtitleSize,
    backgroundColor,
    gradientColor,
    image,
    imageSize,
    imageShadow,
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth,
    fontFamily,
    imagePosition
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setImage(reader.result as string));
        setImagePosition({ x: 0, y: 0 }); // Reset position when new image is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const validateFilename = (value: string) => {
    const regex = /^[A-Z_]+$/;
    return regex.test(value);
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFilename(value);
    if (!validateFilename(value)) {
      setError('Only uppercase letters A-Z and underscore (_) are allowed');
    } else {
      setError('');
    }
  };

  const exportToPng = async () => {
    if (!validateFilename(filename)) {
      setError('Please fix the filename before exporting');
      return;
    }

    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
      setShowExportModal(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (image) {
      setIsDragging(true);
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width / canvas.width);
      const y = (e.clientY - rect.top) / (rect.height / canvas.height);
      
      // Check if click is within image bounds
      const imageWidth = imageSize;
      const imageHeight = imageRef.current ? (imageSize / imageRef.current.width) * imageRef.current.height : imageSize;
      const imageX = canvas.width - imageWidth - padding.left + imagePosition.x;
      const imageY = (canvas.height - imageHeight) / 2 + imagePosition.y;
      
      if (
        x >= imageX && x <= imageX + imageWidth &&
        y >= imageY && y <= imageY + imageHeight
      ) {
        canvas.style.cursor = 'grabbing';
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && image) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const movementX = (e.movementX / rect.width) * canvas.width;
      const movementY = (e.movementY / rect.height) * canvas.height;
      
      setImagePosition(prev => ({
        x: prev.x + movementX,
        y: prev.y + movementY
      }));
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleRemoveImage = () => {
    dispatch(setImage(''));
    setImagePosition({ x: 0, y: 0 });
    setShowImageControls(false);
  };

  const handleReset = () => {
    dispatch(resetToDefault());
    setImagePosition({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Low Code Social Banner</h1>
            <p className="text-lg text-gray-600">Simple tool to build images for use in a website's social preview</p>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export PNG
          </button>
        </div>

        <div className="grid grid-cols-[1fr,300px] gap-6">
          <div>
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <textarea
                    value={title}
                    onChange={(e) => dispatch(setTitle(e.target.value))}
                    className="w-full p-2 border rounded resize-y min-h-[100px]"
                    placeholder="Enter your title..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <textarea
                    value={subtitle}
                    onChange={(e) => dispatch(setSubtitle(e.target.value))}
                    className="w-full p-2 border rounded resize-y min-h-[100px]"
                    placeholder="Enter your subtitle..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div 
                className="relative"
                onMouseEnter={() => image && setShowImageControls(true)}
                onMouseLeave={() => setShowImageControls(false)}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: `${currentRatio.width * scale}px`,
                    height: `${currentRatio.height * scale}px`
                  }}
                  className="rounded-lg shadow-xl cursor-default"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                {showImageControls && image && (
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
            <h2 className="text-lg font-semibold mb-4">Style Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600 w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>

              {image && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image Size ({imageSize}px)
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="800"
                      value={imageSize}
                      onChange={(e) => dispatch(setImageSize(Number(e.target.value)))}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="imageShadow"
                      checked={imageShadow}
                      onChange={(e) => dispatch(setImageShadow(e.target.checked))}
                      className="mr-2"
                    />
                    <label htmlFor="imageShadow" className="text-sm font-medium text-gray-700">
                      Add Drop Shadow
                    </label>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => dispatch(setAspectRatio(e.target.value as AspectRatioKey))}
                    className="w-full p-2 border rounded"
                  >
                    {Object.entries(ASPECT_RATIOS).map(([key, { ratio }]) => (
                      <option key={key} value={key}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Text Alignment
                  </label>
                  <select
                    value={textAlignment}
                    onChange={(e) => dispatch(setTextAlignment(e.target.value as 'top' | 'center' | 'bottom'))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Text Width ({textWidth}%)
                </label>
                <input
                  type="range"
                  min="20"
                  max="80"
                  value={textWidth}
                  onChange={(e) => dispatch(setTextWidth(Number(e.target.value)))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Size ({titleSize}px)
                  </label>
                  <input
                    type="range"
                    min="32"
                    max="72"
                    value={titleSize}
                    onChange={(e) => dispatch(setTitleSize(Number(e.target.value)))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Color
                  </label>
                  <input
                    type="color"
                    value={titleColor}
                    onChange={(e) => dispatch(setTitleColor(e.target.value))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle Size ({subtitleSize}px)
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={subtitleSize}
                    onChange={(e) => dispatch(setSubtitleSize(Number(e.target.value)))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle Color
                  </label>
                  <input
                    type="color"
                    value={subtitleColor}
                    onChange={(e) => dispatch(setSubtitleColor(e.target.value))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Color
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => dispatch(setBackgroundColor(e.target.value))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Color
                  </label>
                  <input
                    type="color"
                    value={gradientColor}
                    onChange={(e) => dispatch(setGradientColor(e.target.value))}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => dispatch(setFontFamily(e.target.value))}
                  className="w-full p-2 border rounded"
                  style={{ fontFamily: fontFamily }}
                >
                  {GOOGLE_FONTS.map(font => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Left Padding ({padding.left}px)
                </label>
                <input
                  type="range"
                  min="16"
                  max="128"
                  value={padding.left}
                  onChange={(e) => dispatch(setPadding({ key: 'left', value: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Top Padding ({padding.top}px)
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="128"
                    value={padding.top}
                    onChange={(e) => dispatch(setPadding({ key: 'top', value: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bottom Padding ({padding.bottom}px)
                  </label>
                  <input
                    type="range"
                    min="16"
                    max="128"
                    value={padding.bottom}
                    onChange={(e) => dispatch(setPadding({ key: 'bottom', value: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors mt-6"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Export Banner</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filename
              </label>
              <input
                type="text"
                value={filename}
                onChange={handleFilenameChange}
                className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="BANNER"
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Only uppercase letters (A-Z) and underscore (_) are allowed
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={exportToPng}
                disabled={!!error}
                className={`px-4 py-2 rounded text-white ${error ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;