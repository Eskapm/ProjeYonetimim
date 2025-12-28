import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Pencil, Type, Undo2, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoEditorProps {
  imageData: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

type Tool = "draw" | "text";

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
  }, [actions, currentPath, color, lineWidth, imageData, imageLoaded]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (tool === "draw") {
      setIsDrawing(true);
      const coords = getCanvasCoordinates(e);
      setCurrentPath([coords]);
    } else if (tool === "text") {
      setIsAddingText(true);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool !== "draw") return;
    
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    setCurrentPath((prev) => [...prev, coords]);
  };

  const handleEnd = () => {
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
    if (tool === "text" && textInput.trim()) {
      const coords = getCanvasCoordinates(e);
      setActions((prev) => [
        ...prev,
        { type: "text", text: textInput, x: coords.x, y: coords.y, color, fontSize },
      ]);
      setTextInput("");
      setIsAddingText(false);
    } else if (tool === "text") {
      setIsAddingText(true);
    }
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
            Fotoğraf üzerine çizim yapabilir veya yazı ekleyebilirsiniz
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={tool === "draw" ? "default" : "outline"}
                onClick={() => { setTool("draw"); setIsAddingText(false); }}
                data-testid="button-tool-draw"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Çiz
              </Button>
              <Button
                size="sm"
                variant={tool === "text" ? "default" : "outline"}
                onClick={() => setTool("text")}
                data-testid="button-tool-text"
              >
                <Type className="h-4 w-4 mr-1" />
                Yazı
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
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={actions.length === 0}
                data-testid="button-undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={actions.length === 0}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {tool === "draw" && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Kalınlık:</Label>
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
            </div>
          )}

          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-muted flex justify-center items-center min-h-[200px] relative"
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={cn(
                "cursor-crosshair touch-none",
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
              style={{
                maxWidth: "100%",
                height: "auto",
              }}
            />
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
