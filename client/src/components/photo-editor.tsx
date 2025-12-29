import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Pencil, Type, Undo2, RotateCcw, Check, X, Loader2, ZoomIn, ZoomOut, Move, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoEditorProps {
  imageData: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImage: string) => void;
}

type Tool = "draw" | "text" | "pan" | "select";

interface DrawAction {
  type: "draw";
  id: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface TextAction {
  type: "text";
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  scale: number;
  rotation: number;
}

type Action = DrawAction | TextAction;

interface SelectionHandle {
  type: "scale" | "rotate";
  cursor: string;
}

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
  
  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  
  // Selection state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialScale, setInitialScale] = useState(1);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);
  const [centerPoint, setCenterPoint] = useState({ x: 0, y: 0 });
  
  // Pinch zoom state
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const [lastPinchCenter, setLastPinchCenter] = useState<{ x: number; y: number } | null>(null);

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
      setTextInput("");
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setSelectedId(null);
      setTimeout(loadImage, 100);
    }
  }, [isOpen, imageData, loadImage]);

  const getActionBounds = (action: Action): { x: number; y: number; width: number; height: number; centerX: number; centerY: number } => {
    if (action.type === "text") {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
      const ctx = canvas.getContext("2d");
      if (!ctx) return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
      
      ctx.font = `${action.fontSize * action.scale}px Arial`;
      const metrics = ctx.measureText(action.text);
      const width = metrics.width;
      const height = action.fontSize * action.scale;
      
      return {
        x: action.x,
        y: action.y - height,
        width,
        height,
        centerX: action.x + width / 2,
        centerY: action.y - height / 2,
      };
    } else {
      // For draw actions, calculate bounding box
      if (action.points.length === 0) return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      action.points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
      
      const width = (maxX - minX) * action.scale;
      const height = (maxY - minY) * action.scale;
      const centerX = (minX + maxX) / 2 + action.offsetX;
      const centerY = (minY + maxY) / 2 + action.offsetY;
      
      return {
        x: centerX - width / 2,
        y: centerY - height / 2,
        width,
        height,
        centerX,
        centerY,
      };
    }
  };

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
        ctx.save();
        
        if (action.type === "draw" && action.points.length > 0) {
          // Calculate original center (without offset)
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          action.points.forEach(p => {
            minX = Math.min(minX, p.x);
            minY = Math.min(minY, p.y);
            maxX = Math.max(maxX, p.x);
            maxY = Math.max(maxY, p.y);
          });
          const originalCenterX = (minX + maxX) / 2;
          const originalCenterY = (minY + maxY) / 2;
          
          // Apply transforms: translate to new position, rotate around center, scale
          ctx.translate(originalCenterX + action.offsetX, originalCenterY + action.offsetY);
          ctx.rotate(action.rotation);
          ctx.scale(action.scale, action.scale);
          ctx.translate(-originalCenterX, -originalCenterY);
          
          ctx.beginPath();
          ctx.strokeStyle = action.color;
          ctx.lineWidth = action.lineWidth;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          // Draw points at original positions (transform handles the offset)
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        } else if (action.type === "text") {
          ctx.translate(action.x, action.y);
          ctx.rotate(action.rotation);
          ctx.scale(action.scale, action.scale);
          
          ctx.font = `${action.fontSize}px Arial`;
          ctx.fillStyle = action.color;
          ctx.fillText(action.text, 0, 0);
        }
        
        ctx.restore();
        
        // Draw selection handles
        if (action.id === selectedId) {
          const bounds = getActionBounds(action);
          const padding = 8;
          
          ctx.save();
          ctx.strokeStyle = "#0066ff";
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          
          if (action.type === "text") {
            ctx.translate(action.x, action.y);
            ctx.rotate(action.rotation);
            ctx.scale(action.scale, action.scale);
            
            const metrics = ctx.measureText(action.text);
            ctx.strokeRect(-padding, -action.fontSize - padding, metrics.width + padding * 2, action.fontSize + padding * 2);
            
            // Scale handle (bottom-right)
            ctx.setLineDash([]);
            ctx.fillStyle = "#0066ff";
            ctx.fillRect(metrics.width + padding - 6, -6, 12, 12);
            
            // Rotate handle (top-center)
            ctx.beginPath();
            ctx.arc(metrics.width / 2, -action.fontSize - padding - 15, 8, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.strokeRect(bounds.x - padding, bounds.y - padding, bounds.width + padding * 2, bounds.height + padding * 2);
            
            // Scale handle
            ctx.setLineDash([]);
            ctx.fillStyle = "#0066ff";
            ctx.fillRect(bounds.x + bounds.width + padding - 6, bounds.y + bounds.height + padding - 6, 12, 12);
            
            // Rotate handle
            ctx.beginPath();
            ctx.arc(bounds.centerX, bounds.y - padding - 15, 8, 0, Math.PI * 2);
            ctx.fill();
          }
          
          ctx.restore();
        }
      });

      // Draw current path
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
  }, [actions, currentPath, color, lineWidth, imageData, imageLoaded, selectedId]);

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

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Transform world coordinates to object's local coordinates (accounting for rotation)
  const worldToLocal = (x: number, y: number, action: Action): { x: number; y: number } => {
    const bounds = getActionBounds(action);
    const rotation = action.rotation;
    
    // Translate to center, rotate inversely, translate back
    const dx = x - bounds.centerX;
    const dy = y - bounds.centerY;
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    
    return {
      x: bounds.centerX + dx * cos - dy * sin,
      y: bounds.centerY + dx * sin + dy * cos,
    };
  };

  const findActionAtPosition = (x: number, y: number): Action | null => {
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      const bounds = getActionBounds(action);
      const padding = 20;
      
      // Transform click position to object's local space
      const local = worldToLocal(x, y, action);
      
      if (
        local.x >= bounds.x - padding &&
        local.x <= bounds.x + bounds.width + padding &&
        local.y >= bounds.y - padding &&
        local.y <= bounds.y + bounds.height + padding
      ) {
        return action;
      }
    }
    return null;
  };

  const isOnScaleHandle = (x: number, y: number, action: Action): boolean => {
    const bounds = getActionBounds(action);
    // Transform click to local space
    const local = worldToLocal(x, y, action);
    
    const handleX = bounds.x + bounds.width + 8;
    const handleY = bounds.y + bounds.height + 8;
    const distance = Math.sqrt((local.x - handleX) ** 2 + (local.y - handleY) ** 2);
    return distance < 20;
  };

  const isOnRotateHandle = (x: number, y: number, action: Action): boolean => {
    const bounds = getActionBounds(action);
    // Transform click to local space
    const local = worldToLocal(x, y, action);
    
    const handleX = bounds.centerX;
    const handleY = bounds.y - 23;
    const distance = Math.sqrt((local.x - handleX) ** 2 + (local.y - handleY) ** 2);
    return distance < 20;
  };

  const getPinchDistance = (e: React.TouchEvent): number => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getPinchCenter = (e: React.TouchEvent): { x: number; y: number } => {
    if (e.touches.length < 2) return { x: 0, y: 0 };
    return {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Handle pinch zoom/rotate for selected item or view zoom
    if ("touches" in e && e.touches.length === 2) {
      const distance = getPinchDistance(e);
      const center = getPinchCenter(e);
      
      if (selectedId) {
        // Pinch to scale/rotate selected item
        const action = actions.find(a => a.id === selectedId);
        if (action) {
          setInitialScale(action.scale);
          setInitialRotation(action.rotation);
          setInitialDistance(distance);
          
          // Calculate initial angle
          const dx = e.touches[1].clientX - e.touches[0].clientX;
          const dy = e.touches[1].clientY - e.touches[0].clientY;
          setInitialAngle(Math.atan2(dy, dx));
          
          setIsScaling(true);
          setIsRotating(true);
        }
      } else {
        // Pinch to zoom view
        setLastPinchDistance(distance);
        setLastPinchCenter(center);
      }
      return;
    }
    
    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on selection handles
    if (selectedId && tool === "select") {
      const action = actions.find(a => a.id === selectedId);
      if (action) {
        if (isOnScaleHandle(coords.x, coords.y, action)) {
          setIsScaling(true);
          setInitialScale(action.scale);
          const bounds = getActionBounds(action);
          setCenterPoint({ x: bounds.centerX, y: bounds.centerY });
          setInitialDistance(Math.sqrt((coords.x - bounds.centerX) ** 2 + (coords.y - bounds.centerY) ** 2));
          return;
        }
        if (isOnRotateHandle(coords.x, coords.y, action)) {
          setIsRotating(true);
          setInitialRotation(action.rotation);
          const bounds = getActionBounds(action);
          setCenterPoint({ x: bounds.centerX, y: bounds.centerY });
          setInitialAngle(Math.atan2(coords.y - bounds.centerY, coords.x - bounds.centerX));
          return;
        }
      }
    }
    
    // Select mode - find and select item
    if (tool === "select") {
      const actionAtPos = findActionAtPosition(coords.x, coords.y);
      if (actionAtPos) {
        setSelectedId(actionAtPos.id);
        setIsDragging(true);
        
        if (actionAtPos.type === "text") {
          setDragOffset({
            x: coords.x - actionAtPos.x,
            y: coords.y - actionAtPos.y,
          });
        } else {
          setDragOffset({
            x: coords.x - actionAtPos.offsetX,
            y: coords.y - actionAtPos.offsetY,
          });
        }
        return;
      } else {
        setSelectedId(null);
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
      setSelectedId(null);
    } else if (tool === "text" && textInput.trim()) {
      const newId = `text-${Date.now()}`;
      setActions((prev) => [
        ...prev,
        { type: "text", id: newId, text: textInput, x: coords.x, y: coords.y, color, fontSize, scale: 1, rotation: 0 },
      ]);
      setTextInput("");
      setSelectedId(newId);
      setTool("select");
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Handle pinch zoom/scale/rotate
    if ("touches" in e && e.touches.length === 2) {
      const newDistance = getPinchDistance(e);
      const newCenter = getPinchCenter(e);
      
      if (selectedId && (isScaling || isRotating)) {
        // Scale and rotate selected item
        const scaleFactor = newDistance / initialDistance;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const newAngle = Math.atan2(dy, dx);
        const angleDiff = newAngle - initialAngle;
        
        setActions(prev => prev.map(action => {
          if (action.id === selectedId) {
            return {
              ...action,
              scale: Math.max(0.2, Math.min(5, initialScale * scaleFactor)),
              rotation: initialRotation + angleDiff,
            };
          }
          return action;
        }));
      } else if (lastPinchDistance !== null && lastPinchCenter !== null) {
        // Zoom view centered on pinch
        const delta = newDistance - lastPinchDistance;
        const zoomDelta = delta * 0.005;
        const newZoom = Math.max(0.5, Math.min(3, zoom + zoomDelta));
        
        // Adjust pan to zoom toward pinch center
        if (containerRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const centerX = newCenter.x - containerRect.left;
          const centerY = newCenter.y - containerRect.top;
          
          const zoomRatio = newZoom / zoom;
          setPan(prev => ({
            x: centerX - (centerX - prev.x) * zoomRatio,
            y: centerY - (centerY - prev.y) * zoomRatio,
          }));
        }
        
        setZoom(newZoom);
        setLastPinchDistance(newDistance);
        setLastPinchCenter(newCenter);
      }
      return;
    }
    
    const coords = getCanvasCoordinates(e);
    
    // Handle scaling with mouse
    if (isScaling && selectedId) {
      const currentDistance = Math.sqrt((coords.x - centerPoint.x) ** 2 + (coords.y - centerPoint.y) ** 2);
      const scaleFactor = currentDistance / initialDistance;
      
      setActions(prev => prev.map(action => {
        if (action.id === selectedId) {
          return {
            ...action,
            scale: Math.max(0.2, Math.min(5, initialScale * scaleFactor)),
          };
        }
        return action;
      }));
      return;
    }
    
    // Handle rotating with mouse
    if (isRotating && selectedId) {
      const currentAngle = Math.atan2(coords.y - centerPoint.y, coords.x - centerPoint.x);
      const angleDiff = currentAngle - initialAngle;
      
      setActions(prev => prev.map(action => {
        if (action.id === selectedId) {
          return {
            ...action,
            rotation: initialRotation + angleDiff,
          };
        }
        return action;
      }));
      return;
    }
    
    // Handle dragging selected item
    if (isDragging && selectedId) {
      setActions(prev => prev.map(action => {
        if (action.id === selectedId) {
          if (action.type === "text") {
            return {
              ...action,
              x: coords.x - dragOffset.x,
              y: coords.y - dragOffset.y,
            };
          } else {
            return {
              ...action,
              offsetX: coords.x - dragOffset.x,
              offsetY: coords.y - dragOffset.y,
            };
          }
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
    
    setCurrentPath((prev) => [...prev, coords]);
  };

  const handleEnd = () => {
    // End pinch zoom
    setLastPinchDistance(null);
    setLastPinchCenter(null);
    
    // End scaling/rotating
    setIsScaling(false);
    setIsRotating(false);
    
    // End dragging
    setIsDragging(false);
    
    // End panning
    setIsPanning(false);
    
    // End drawing
    if (isDrawing && currentPath.length > 0) {
      const newId = `draw-${Date.now()}`;
      setActions((prev) => [
        ...prev,
        { type: "draw", id: newId, points: currentPath, color, lineWidth, scale: 1, rotation: 0, offsetX: 0, offsetY: 0 },
      ]);
      setCurrentPath([]);
      setSelectedId(newId);
      setTool("select");
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    // Get mouse position relative to container
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;
    
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    
    // Adjust pan to zoom toward mouse position
    const zoomRatio = newZoom / zoom;
    setPan(prev => ({
      x: mouseX - (mouseX - prev.x) * zoomRatio,
      y: mouseY - (mouseY - prev.y) * zoomRatio,
    }));
    
    setZoom(newZoom);
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
    setSelectedId(null);
  };

  const handleReset = () => {
    setActions([]);
    setCurrentPath([]);
    setSelectedId(null);
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setActions(prev => prev.filter(a => a.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    setSelectedId(null); // Clear selection before saving
    setTimeout(() => {
      if (!canvasRef.current) return;
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
      onSave(dataUrl);
    }, 100);
  };

  const selectedAction = selectedId ? actions.find(a => a.id === selectedId) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={true}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto z-[100]">
        <DialogHeader>
          <DialogTitle>Fotoğraf Düzenle</DialogTitle>
          <DialogDescription>
            Çizim veya yazı ekleyin, sonra seçerek taşıyın, büyütün veya döndürün
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={tool === "draw" ? "default" : "outline"}
                onClick={() => { setTool("draw"); setSelectedId(null); }}
                data-testid="button-tool-draw"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Çiz
              </Button>
              <Button
                size="sm"
                variant={tool === "text" ? "default" : "outline"}
                onClick={() => { setTool("text"); setSelectedId(null); }}
                data-testid="button-tool-text"
              >
                <Type className="h-4 w-4 mr-1" />
                Yazı
              </Button>
              <Button
                size="sm"
                variant={tool === "select" ? "default" : "outline"}
                onClick={() => setTool("select")}
                data-testid="button-tool-select"
              >
                <Move className="h-4 w-4 mr-1" />
                Seç
              </Button>
              <Button
                size="sm"
                variant={tool === "pan" ? "default" : "outline"}
                onClick={() => { setTool("pan"); setSelectedId(null); }}
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
              {selectedId && (
                <Button size="sm" variant="destructive" onClick={handleDeleteSelected} data-testid="button-delete-selected">
                  <X className="h-4 w-4" />
                </Button>
              )}
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
            </div>
          )}
          
          {tool === "select" && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Bir öğe seçin, sonra:</p>
              <ul className="list-disc list-inside">
                <li>Sürükleyerek taşıyın</li>
                <li>Köşe tutamacını sürükleyerek büyütün/küçültün</li>
                <li>Üst tutamacı sürükleyerek döndürün</li>
                <li>İki parmakla büyütüp döndürün (dokunmatik)</li>
              </ul>
            </div>
          )}
          
          {tool === "pan" && (
            <p className="text-sm text-muted-foreground">
              Resmi kaydırmak için sürükleyin. Yakınlaştırmak için fare tekerleğini veya iki parmağınızı kullanın.
            </p>
          )}

          {selectedAction && (
            <div className="flex items-center gap-4 p-2 bg-muted rounded-md">
              <span className="text-sm font-medium">Seçili: {selectedAction.type === "text" ? "Yazı" : "Çizim"}</span>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Boyut:</Label>
                <span className="text-sm">{Math.round(selectedAction.scale * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm">Döndürme:</Label>
                <span className="text-sm">{Math.round(selectedAction.rotation * 180 / Math.PI)}°</span>
              </div>
            </div>
          )}

          <div 
            ref={containerRef}
            className="border rounded-lg overflow-hidden bg-muted flex justify-center items-center min-h-[200px] relative"
            style={{ 
              cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair",
            }}
            onWheel={handleWheel}
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
                transition: isPanning || isDragging || isScaling || isRotating ? "none" : "transform 0.1s ease-out",
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
