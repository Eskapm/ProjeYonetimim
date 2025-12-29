import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Pencil, Type, Undo2, RotateCcw, Check, X, Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoEditorProps {
  imageData: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

type Tool = "draw" | "text" | "pan";

interface DrawAction {
  type: "draw";
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

interface TextAction {
  type: "text";
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  id: string;
}

type Action = DrawAction | TextAction;

export function PhotoEditor({ imageData, isOpen, onClose, onSave }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#ff0000");
  const [lineWidth, setLineWidth] = useState(3);
  const [fontSize, setFontSize] = useState(24);
  const [textInput, setTextInput] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isAddingText, setIsAddingText] = useState(false);
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Dragging text state
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Pinch zoom state
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);

  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff", "#000000"];

  const loadImage = useCallback(() => {
    if (!canvasRef.current || !imageData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const maxWidth = Math.min(window.innerWidth * 0.8, 800);
      const maxHeight = window.innerHeight * 0.6;
      
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      setImageDimensions({ width, height });

      ctx.drawImage(img, 0, 0, width, height);
      setImageLoaded(true);
    };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    if (isOpen && imageData) {
      setActions([]);
      setCurrentPath([]);
      setImageLoaded(false);
      setIsAddingText(false);
      setTextInput("");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setDraggingTextId(null);
      setTimeout(loadImage, 100);
    }
  }, [isOpen, imageData, loadImage]);

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      actions.forEach((action) => {
        if (action.type === "draw" && action.points.length > 0) {
          ctx.beginPath();
          ctx.strokeStyle = action.color;
          ctx.lineWidth = action.lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        } else if (action.type === "text") {
          ctx.font = `${action.fontSize}px Arial`;
          ctx.fillStyle = action.color;
          ctx.fillText(action.text, action.x, action.y);
          
          // Draw selection box if this text is being dragged
          if (action.id === draggingTextId) {
            const metrics = ctx.measureText(action.text);
            ctx.strokeStyle = "#0066ff";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
              action.x - 4,
              action.y - action.fontSize,
              metrics.width + 8,
              action.fontSize + 8
            );
            ctx.setLineDash([]);
          }
        }
      });

      if (currentPath.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        ctx.stroke();
      }
    };
    img.src = imageData;
  }, [actions, currentPath, color, lineWidth, imageData, imageLoaded, draggingTextId]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("changedTouches" in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return { x: 0, y: 0 };
    }

    // Account for zoom and pan
    const scaleX = canvas.width / (rect.width * zoom);
    const scaleY = canvas.height / (rect.height * zoom);
    
    return {
      x: (clientX - rect.left - pan.x) * scaleX,
      y: (clientY - rect.top - pan.y) * scaleY,
    };
  };

  const findTextAtPosition = (x: number, y: number): TextAction | null => {
    if (!canvasRef.current) return null;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return null;
    
    // Check in reverse order (top-most first)
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      if (action.type === "text") {
        ctx.font = `${action.fontSize}px Arial`;
        const metrics = ctx.measureText(action.text);
        const textWidth = metrics.width;
        const textHeight = action.fontSize;
        
        if (
          x >= action.x - 4 &&
          x <= action.x + textWidth + 4 &&
          y >= action.y - textHeight &&
          y <= action.y + 8
        ) {
          return action;
        }
      }
    }
    return null;
  };

  const getPinchDistance = (e: React.TouchEvent): number => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Handle pinch zoom start
    if ("touches" in e && e.touches.length === 2) {
      setLastPinchDistance(getPinchDistance(e));
      return;
    }
    
    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on existing text (for dragging)
    if (tool === "text") {
      const textAtPos = findTextAtPosition(coords.x, coords.y);
      if (textAtPos) {
        setDraggingTextId(textAtPos.id);
        setDragOffset({
          x: coords.x - textAtPos.x,
          y: coords.y - textAtPos.y,
        });
        return;
      }
    }
    
    if (tool === "pan") {
      setIsPanning(true);
      if ("touches" in e && e.touches.length > 0) {
        setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      } else if ("clientX" in e) {
        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
      return;
    }
    
    if (tool === "draw") {
      setIsDrawing(true);
      setCurrentPath([coords]);
    } else if (tool === "text") {
      setIsAddingText(true);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Handle pinch zoom
    if ("touches" in e && e.touches.length === 2 && lastPinchDistance !== null) {
      const newDistance = getPinchDistance(e);
      const delta = newDistance - lastPinchDistance;
      const zoomDelta = delta * 0.01;
      setZoom(prev => Math.max(0.5, Math.min(3, prev + zoomDelta)));
      setLastPinchDistance(newDistance);
      return;
    }
    
    // Handle text dragging
    if (draggingTextId) {
      const coords = getCanvasCoordinates(e);
      setActions(prev => prev.map(action => {
        if (action.type === "text" && action.id === draggingTextId) {
          return {
            ...action,
            x: coords.x - dragOffset.x,
            y: coords.y - dragOffset.y,
          };
        }
        return action;
      }));
      return;
    }
    
    // Handle panning
    if (isPanning && tool === "pan") {
      let clientX: number, clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return;
      }
      
      const deltaX = clientX - lastPanPoint.x;
      const deltaY = clientY - lastPanPoint.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastPanPoint({ x: clientX, y: clientY });
      return;
    }
    
    if (!isDrawing || tool !== "draw") return;
    
    const coords = getCanvasCoordinates(e);
    setCurrentPath((prev) => [...prev, coords]);
  };

  const handleEnd = (e?: React.MouseEvent | React.TouchEvent) => {
    // End pinch zoom
    setLastPinchDistance(null);
    
    // End text dragging
    if (draggingTextId) {
      setDraggingTextId(null);
      return;
    }
    
    // End panning
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDrawing && currentPath.length > 0) {
      setActions((prev) => [
        ...prev,
        { type: "draw", points: currentPath, color, lineWidth },
      ]);
      setCurrentPath([]);
    }
    setIsDrawing(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === "pan") return;
    
    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on existing text
    if (tool === "text") {
      const textAtPos = findTextAtPosition(coords.x, coords.y);
      if (textAtPos) {
        // Text is now selected for dragging (handled in handleStart)
        return;
      }
      
      // Add new text if input has content
      if (textInput.trim()) {
        const newId = `text-${Date.now()}`;
        setActions((prev) => [
          ...prev,
          { type: "text", text: textInput, x: coords.x, y: coords.y, color, fontSize, id: newId },
        ]);
        setTextInput("");
        setIsAddingText(false);
      } else {
        setIsAddingText(true);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.2));
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    setActions((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    setActions([]);
    setCurrentPath([]);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    onSave(dataUrl);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto z-[100]">
        <DialogHeader>
          <DialogTitle>Fotoğraf Düzenle</DialogTitle>
          <DialogDescription>
            Fotoğraf üzerine çizim yapabilir, yazı ekleyebilir ve yerini değiştirebilirsiniz. Yakınlaştırmak için kaydırma tekerleğini veya parmak hareketlerini kullanın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={tool === "draw" ? "default" : "outline"}
                onClick={() => { setTool("draw"); setIsAddingText(false); setDraggingTextId(null); }}
                data-testid="button-tool-draw"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Çiz
              </Button>
              <Button
                size="sm"
                variant={tool === "text" ? "default" : "outline"}
                onClick={() => { setTool("text"); setDraggingTextId(null); }}
                data-testid="button-tool-text"
              >
                <Type className="h-4 w-4 mr-1" />
                Yazı
              </Button>
              <Button
                size="sm"
                variant={tool === "pan" ? "default" : "outline"}
                onClick={() => { setTool("pan"); setIsAddingText(false); setDraggingTextId(null); }}
                data-testid="button-tool-pan"
              >
                <Move className="h-4 w-4 mr-1" />
                Kaydır
              </Button>
            </div>

            <div className="flex gap-1 items-center">
              {colors.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-6 h-6 rounded-full border-2",
                    color === c ? "border-foreground" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  data-testid={`button-color-${c.replace("#", "")}`}
                />
              ))}
            </div>

            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={handleUndo} data-testid="button-undo">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset} data-testid="button-reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Zoom controls */}
            <div className="flex gap-1 items-center border-l pl-2">
              <Button size="sm" variant="outline" onClick={handleZoomOut} data-testid="button-zoom-out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="sm" variant="outline" onClick={handleZoomIn} data-testid="button-zoom-in">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleResetView} data-testid="button-reset-view">
                Sıfırla
              </Button>
            </div>
          </div>

          {tool === "draw" && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Çizgi kalınlığı:</Label>
              <Slider
                value={[lineWidth]}
                onValueChange={(v) => setLineWidth(v[0])}
                min={1}
                max={20}
                step={1}
                className="w-32"
                data-testid="slider-line-width"
              />
              <span className="text-sm text-muted-foreground">{lineWidth}px</span>
            </div>
          )}

          {tool === "text" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Yazı boyutu:</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(v) => setFontSize(v[0])}
                  min={12}
                  max={72}
                  step={2}
                  className="w-32"
                  data-testid="slider-font-size"
                />
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  placeholder="Eklenecek yazıyı girin..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="flex-1 min-w-[200px]"
                  data-testid="input-text-content"
                />
                <span className={cn(
                  "text-sm",
                  textInput.trim() ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                  {textInput.trim() 
                    ? "Resme tıklayarak yazıyı yerleştirin" 
                    : "Önce yazınızı girin"
                  }
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Mevcut yazıları sürükleyerek taşıyabilirsiniz
              </p>
            </div>
          )}
          
          {tool === "pan" && (
            <p className="text-sm text-muted-foreground">
              Resmi kaydırmak için sürükleyin. Yakınlaştırmak için fare tekerleğini veya iki parmağınızı kullanın.
            </p>
          )}

          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-muted flex justify-center items-center min-h-[200px] relative"
            style={{ 
              cursor: tool === "pan" ? "grab" : tool === "text" && draggingTextId ? "move" : "crosshair",
            }}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <div
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: "center center",
                transition: isPanning || draggingTextId ? "none" : "transform 0.1s ease-out",
              }}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "touch-none",
                  !imageLoaded && "opacity-0"
                )}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onClick={handleCanvasClick}
                onWheel={handleWheel}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
            <X className="h-4 w-4 mr-1" />
            İptal
          </Button>
          <Button onClick={handleSave} data-testid="button-save-edit">
            <Check className="h-4 w-4 mr-1" />
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
