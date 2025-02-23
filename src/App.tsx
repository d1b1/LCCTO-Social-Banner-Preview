import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  addImage,
  removeImage,
  updateImagePosition,
  updateImageSize,
  updateImageShadow,
  setAspectRatio,
  setTextAlignment,
  setPadding,
  setTitleColor,
  setSubtitleColor,
  setTextWidth,
  setFontFamily,
  resetToDefault,
  ASPECT_RATIOS,
  type AspectRatioKey,
  setShowBorder,
  setBorderWidth,
  setBorderColor,
} from './store/bannerSlice';

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
    images,
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth,
    fontFamily,
    showBorder,
    borderWidth,
    borderColor,
  } = useSelector((state: RootState) => state.banner);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRefs = useRef<{ [key: string]: HTMLImageElement }>({});
  const [showExportModal, setShowExportModal] = useState(false);
  const [filename, setFilename] = useState('BANNER');
  const [error, setError] = useState('');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
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

    // Draw border if enabled
    if (showBorder) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        borderWidth / 2,
        borderWidth / 2,
        canvas.width - borderWidth,
        canvas.height - borderWidth
      );
    }

    // Draw all images
    images.forEach(image => {
      const img = imageRefs.current[image.id];
      if (img) {
        const aspectRatio = img.width / img.height;
        let drawWidth = image.size;
        let drawHeight = drawWidth / aspectRatio;
        
        if (image.shadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 10;
          ctx.shadowOffsetY = 10;
        }
        
        ctx.drawImage(
          img,
          canvas.width - drawWidth - padding.left + image.position.x,
          (canvas.height - drawHeight) / 2 + image.position.y,
          drawWidth,
          drawHeight
        );

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    });

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
    // Load all images
    images.forEach(image => {
      if (!imageRefs.current[image.id]) {
        const img = new Image();
        img.src = image.url;
        img.onload = () => {
          imageRefs.current[image.id] = img;
          drawCanvas();
        };
      }
    });
    drawCanvas();
  }, [
    title,
    subtitle,
    titleSize,
    subtitleSize,
    backgroundColor,
    gradientColor,
    images,
    aspectRatio,
    textAlignment,
    padding,
    titleColor,
    subtitleColor,
    textWidth,
    fontFamily,
    showBorder,
    borderWidth,
    borderColor
  ]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch(addImage(reader.result as string));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateFilename = (value: string) => {
    return value.length > 0;
  };

  const sanitizeFilename = (value: string) => {
    // Replace any character that's not A-Z, a-z, or 0-9 with underscore
    return value.replace(/[^A-Za-z0-9]/g, '_');
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeFilename(e.target.value);
    setFilename(sanitized);
    if (!validateFilename(sanitized)) {
      setError('Filename cannot be empty');
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / canvas.width);
    const y = (e.clientY - rect.top) / (rect.height / canvas.height);
    
    // Check which image was clicked
    for (let i = images.length - 1; i >= 0; i--) {
      const image = images[i];
      const img = imageRefs.current[image.id];
      if (img) {
        const aspectRatio = img.width / img.height;
        const drawWidth = image.size;
        const drawHeight = drawWidth / aspectRatio;
        const imageX = canvas.width - drawWidth - padding.left + image.position.x;
        const imageY = (canvas.height - drawHeight) / 2 + image.position.y;
        
        if (
          x >= imageX && x <= imageX + drawWidth &&
          y >= imageY && y <= imageY + drawHeight
        ) {
          setSelectedImageId(image.id);
          setIsDragging(true);
          canvas.style.cursor = 'grabbing';
          break;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedImageId) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const movementX = (e.movementX / rect.width) * canvas.width;
      const movementY = (e.movementY / rect.height) * canvas.height;
      
      const image = images.find(img => img.id === selectedImageId);
      if (image) {
        dispatch(updateImagePosition({
          id: selectedImageId,
          position: {
            x: image.position.x + movementX,
            y: image.position.y + movementY
          }
        }));
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setSelectedImageId(null);
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'default';
      }
    }
  };

  const handleRemoveImage = (id: string) => {
    dispatch(removeImage(id));
  };

  const handleReset = () => {
    dispatch(resetToDefault());
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

        <div className="grid grid-cols-[1fr,400px] gap-6">
          {/* Left Column: Preview */}
          <div className="space-y-6">
            {/* Canvas Preview */}
            <div className="flex justify-center">
              <div className="relative">
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

            {/* Style Settings Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Style Settings</h2>
              
              <div className="grid grid-cols-3 gap-6">
                {/* Column 1: Text Styles */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Text Styles</h3>
                  
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

                {/* Column 2: Background & Border */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Background & Border</h3>
                  
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

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="show-border"
                        checked={showBorder}
                        onChange={(e) => dispatch(setShowBorder(e.target.checked))}
                        className="mr-2"
                      />
                      <label
                        htmlFor="show-border"
                        className="text-sm font-medium text-gray-700"
                      >
                        Show Border
                      </label>
                    </div>

                    {showBorder && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Border Width ({borderWidth}px)
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={borderWidth}
                            onChange={(e) => dispatch(setBorderWidth(Number(e.target.value)))}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Border Color
                          </label>
                          <input
                            type="color"
                            value={borderColor}
                            onChange={(e) => dispatch(setBorderColor(e.target.value))}
                            className="w-full h-8 rounded cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Layout & Padding */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Layout & Padding</h3>
                  
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

          {/* Right Column: Content Controls */}
          <div className="space-y-6">
            {/* Content Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Content</h2>
              <div className="space-y-4">
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

            {/* Images Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Images</h2>
                <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Image
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </label>
              </div>

              {images.length > 0 ? (
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div key={image.id} className="border rounded p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Image {index + 1}</span>
                        <button
                          onClick={() => handleRemoveImage(image.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Size ({image.size}px)
                          </label>
                          <input
                            type="range"
                            min="200"
                            max="800"
                            value={image.size}
                            onChange={(e) => dispatch(updateImageSize({
                              id: image.id,
                              size: Number(e.target.value)
                            }))}
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id={`shadow-${image.id}`}
                            checked={image.shadow}
                            onChange={(e) => dispatch(updateImageShadow({
                              id: image.id,
                              shadow: e.target.checked
                            }))}
                            className="mr-2"
                          />
                          <label
                            htmlFor={`shadow-${image.id}`}
                            className="text-sm text-gray-600"
                          >
                            Drop Shadow
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No images added yet. Click "Add Image" to get started.</p>
              )}
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
                Letters (A-Z, a-z), numbers (0-9) allowed. Other characters will be replaced with underscore (_)
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