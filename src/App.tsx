import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Draggable from 'react-draggable';
import { Download, Upload, X } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { RootState } from './store/store';
import {
  setTitle,
  setSubtitle,
  setTitleSize,
  setSubtitleSize,
  setBackgroundColor,
  setGradientColor,
  setImage,
  setAspectRatio,
  setTextAlignment,
  setPadding,
  setTitleColor,
  setSubtitleColor,
  setTextWidth,
  ASPECT_RATIOS,
  type AspectRatioKey
} from './store/bannerSlice';

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
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth
  } = useSelector((state: RootState) => state.banner);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filename, setFilename] = useState('BANNER');
  const [error, setError] = useState('');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

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
      let drawWidth = 400;
      let drawHeight = drawWidth / aspectRatio;
      
      ctx.drawImage(
        img,
        canvas.width - drawWidth - padding.left + imagePosition.x,
        (canvas.height - drawHeight) / 2 + imagePosition.y,
        drawWidth,
        drawHeight
      );
    }

    // Configure text settings
    ctx.textAlign = 'left';
    const maxWidth = canvas.width * (textWidth / 100); // Convert percentage to actual width

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
    ctx.font = `bold ${titleSize}px Arial`;
    ctx.fillStyle = titleColor;
    const titleLines = getTextLines(ctx, title, maxWidth);
    titleLines.forEach((line, index) => {
      ctx.fillText(line, padding.left, textY + (index * titleSize * 1.2));
    });

    // Draw subtitle
    ctx.font = `${subtitleSize}px Arial`;
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
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth,
    imagePosition
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(setImage(reader.result as string));
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
      const imageWidth = 400;
      const imageHeight = imageRef.current ? (400 / imageRef.current.width) * imageRef.current.height : 400;
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
                    {Object.entries(ASPECT_RATIOS).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Left/Right Padding ({padding.left}px)
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