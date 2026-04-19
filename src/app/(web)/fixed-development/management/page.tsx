
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "react-qr-code";
import StepIndicator from "@/components/ui/StepIndicator";
import StatusBadge from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/apiClient";

const steps = [
  "Package selection",
  "Customer information",
  "Camera registration",
  "Contract information",
  "Payments",
];

const DRAFT_KEY = "cc_fixed_onboarding_draft";
const DRAFT_VERSION = 3;

const initialCustomer = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
};

const initialCameras = [
  {
    serial: "",
    model: "",
    location: "",
    source: "existing",
    stockMode: "serial",
    stockId: null,
    batchId: null,
    quantity: 1,
  },
];

const initialContract = {
  startDate: "",
  termMonths: 12,
  billingCycle: "Monthly",
};

const initialProfile = {
  companyName: "",
  taxId: "",
  segment: "enterprise",
  provinceCode: "",
  teamCode: "",
  notes: "",
};

const initialPayment = {
  method: "qr",
  autoInvoice: true,
  prepayMonths: 1,
  simulateFailure: false,
};

const initialContext = {
  subscriberId: "",
  contractId: "",
  invoice: null as Invoice | null,
};

type Product = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  billingCycle: string;
  prepaidMonths?: number;
};

type CameraSource = "existing" | "stock";
type CameraStockMode = "serial" | "batch";

type Camera = {
  serial: string;
  model: string;
  location: string;
  source: CameraSource;
  stockMode: CameraStockMode;
  stockId: number | null;
  batchId: number | null;
  quantity: number;
};

type CameraStock = {
  id: number;
  serial: string;
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  status: string;
  unitPrice: number;
  installationFee?: number | null;
  assignedSubscriberId?: string | null;
  assignedContractId?: string | null;
  assignedAt?: string | null;
};

type CameraStockBatch = {
  id: number;
  model: string;
  provinceCode?: string | null;
  teamCode?: string | null;
  quantityAvailable: number;
  quantityAssigned: number;
  unitPrice: number;
  installationFee?: number | null;
};

const PROVINCES = [
  { code: "PNP", name: "Phnom Penh" },
  { code: "BMC", name: "Banteay Meanchey" },
  { code: "BAT", name: "Battambang" },
  { code: "KCH", name: "Kampong Cham" },
  { code: "CHH", name: "Kampong Chhnang" },
  { code: "SPE", name: "Kampong Speu" },
  { code: "KTH", name: "Kampong Thom" },
  { code: "KPT", name: "Kampot" },
  { code: "KDL", name: "Kandal" },
  { code: "KEP", name: "Kep" },
  { code: "KOH", name: "Koh Kong" },
  { code: "KRT", name: "Kratie" },
  { code: "MOD", name: "Mondulkiri" },
  { code: "ODM", name: "Oddar Meanchey" },
  { code: "PAI", name: "Pailin" },
  { code: "PSH", name: "Preah Sihanouk" },
  { code: "PVH", name: "Preah Vihear" },
  { code: "PRV", name: "Prey Veng" },
  { code: "PUR", name: "Pursat" },
  { code: "RAT", name: "Ratanakiri" },
  { code: "SRP", name: "Siem Reap" },
  { code: "STT", name: "Stung Treng" },
  { code: "SVR", name: "Svay Rieng" },
  { code: "TAK", name: "Takeo" },
  { code: "TBK", name: "Tbong Khmum" },
];

const TEAMS_BY_PROVINCE = Object.fromEntries(
  PROVINCES.map((province) => [
    province.code,
    [`TEAM${province.code}1`, `TEAM${province.code}2`, `TEAM${province.code}3`],
  ])
) as Record<string, string[]>;

type InvoiceItem = {
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type Invoice = {
  id: string;
  total: number;
  items: InvoiceItem[];
  autoInvoice: boolean;
};

type StatusState = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  traceId?: string;
};

type WorkflowDraft = {
  version: number;
  step: number;
  selection: Record<string, { selected: boolean; quantity: number }>;
  customer: typeof initialCustomer;
  cameras: Camera[];
  contract: typeof initialContract;
  profile: typeof initialProfile;
  payment: typeof initialPayment;
  context: typeof initialContext;
  qrInfo: { qrUrl: string; qrReference: string; traceId: string } | null;
  lastFailedTrace: string | null;
};
function buildSelection(items: Product[]) {
  const initialSelection: Record<string, { selected: boolean; quantity: number }> = {};
  items.forEach((product) => {
    initialSelection[product.id] = { selected: false, quantity: 1 };
  });
  return initialSelection;
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.floor(value);
}

function loadDraft(): WorkflowDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkflowDraft;
    if (!parsed || parsed.version !== DRAFT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDraft(draft: WorkflowDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export default function FixedManagementWorkflow() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });
  const [products, setProducts] = useState<Product[]>([]);
  const [cameraStock, setCameraStock] = useState<CameraStock[]>([]);
  const [cameraBatches, setCameraBatches] = useState<CameraStockBatch[]>([]);
  const [selection, setSelection] = useState<Record<string, { selected: boolean; quantity: number }>>({});
  const [customer, setCustomer] = useState(initialCustomer);
  const [cameras, setCameras] = useState<Camera[]>(initialCameras);
  const [contract, setContract] = useState(initialContract);
  const [profile, setProfile] = useState(initialProfile);
  const [payment, setPayment] = useState(initialPayment);
  const [context, setContext] = useState(initialContext);
  const [qrInfo, setQrInfo] = useState<{ qrUrl: string; qrReference: string; traceId: string } | null>(null);
  const [lastFailedTrace, setLastFailedTrace] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingStock, setIsLoadingStock] = useState(true);
  const [isLoadingBatches, setIsLoadingBatches] = useState(true);
  const [qrActionStatus, setQrActionStatus] = useState<string | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoadingProducts(true);
    setIsLoadingStock(true);
    setIsLoadingBatches(true);

    Promise.all([
      apiFetch<Product[]>("/api/fixed-development/products"),
      apiFetch<CameraStock[]>("/api/fixed-development/camera_stock"),
      apiFetch<CameraStockBatch[]>("/api/fixed-development/camera_stock_batches"),
    ]).then(([productResult, stockResult, batchResult]) => {
      if (!active) return;

      if (!productResult.ok) {
        setStatus({ type: "error", message: productResult.error, traceId: productResult.traceId });
        setIsLoadingProducts(false);
      } else {
        setProducts(productResult.data);

        const baseSelection = buildSelection(productResult.data);
        const draft = loadDraft();
        if (draft) {
          const mergedSelection = { ...baseSelection };
          Object.entries(draft.selection ?? {}).forEach(([id, value]) => {
            if (!mergedSelection[id]) return;
            mergedSelection[id] = {
              selected: !!value.selected,
              quantity: normalizeQuantity(value.quantity),
            };
          });
          setSelection(mergedSelection);
          setCustomer({ ...initialCustomer, ...draft.customer });
          const baseCameras =
          draft.cameras && draft.cameras.length > 0 ? draft.cameras : initialCameras;
        setCameras(
          baseCameras.map((camera) => ({
            ...camera,
            stockMode: camera.stockMode ?? "serial",
            stockId: camera.stockId ?? null,
            batchId: camera.batchId ?? null,
            quantity: camera.quantity ?? 1,
          }))
        );
          setContract({ ...initialContract, ...draft.contract });
          setProfile({ ...initialProfile, ...draft.profile });
          setPayment({ ...initialPayment, ...draft.payment });
          setContext({ ...initialContext, ...draft.context });
          setQrInfo(draft.qrInfo ?? null);
          setLastFailedTrace(draft.lastFailedTrace ?? null);
          setStep(Math.min(Math.max(draft.step ?? 0, 0), steps.length - 1));
        } else {
          setSelection(baseSelection);
        }

        setIsLoadingProducts(false);
      }

      if (!stockResult.ok) {
        setStatus((prev) => ({
          type: "error",
          message: stockResult.error,
          traceId: stockResult.traceId ?? prev.traceId,
        }));
        setIsLoadingStock(false);
      } else {
        setCameraStock(stockResult.data);
        setIsLoadingStock(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setTimeout(() => {
      saveDraft({
        version: DRAFT_VERSION,
        step,
        selection,
        customer,
        cameras,
        contract,
        profile,
        payment,
        context,
        qrInfo,
        lastFailedTrace,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [
    step,
    selection,
    customer,
    cameras,
    contract,
    profile,
    payment,
    context,
    qrInfo,
    lastFailedTrace,
    products.length,
  ]);
  const getQrSvgString = () => {
    const svg = qrContainerRef.current?.querySelector("svg");
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    return new XMLSerializer().serializeToString(clone);
  };

  const svgToPngBlob = (svgString: string, size = 1024) =>
    new Promise<Blob>((resolve, reject) => {
      const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(image, 0, 0, size, size);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("Failed to create image"));
            return;
          }
          resolve(blob);
        }, "image/png");
      };
      image.onerror = () => reject(new Error("Failed to load QR image"));
      image.src = svgUrl;
    });

  const handleSaveQr = async () => {
    if (!qrInfo) return;
    setQrActionStatus("Preparing download...");
    try {
      const svgString = getQrSvgString();
      if (!svgString) throw new Error("QR not ready");
      const blob = await svgToPngBlob(svgString);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `khqr-${qrInfo.qrReference}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setQrActionStatus("QR saved.");
      setTimeout(() => setQrActionStatus(null), 2000);
    } catch (error) {
      console.error(error);
      setQrActionStatus("Failed to save QR.");
    }
  };

  const handleShareQr = async () => {
    if (!qrInfo) return;
    setQrActionStatus("Preparing share...");
    try {
      const svgString = getQrSvgString();
      if (!svgString) throw new Error("QR not ready");
      const blob = await svgToPngBlob(svgString);
      const file = new File([blob], `khqr-${qrInfo.qrReference}.png`, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "KHQR Payment",
          text: `QR Reference: ${qrInfo.qrReference}`,
          files: [file],
        });
        setQrActionStatus("Shared.");
        setTimeout(() => setQrActionStatus(null), 2000);
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: "KHQR Payment",
          text: `QR Reference: ${qrInfo.qrReference}\nQR URL: ${qrInfo.qrUrl}`,
        });
        setQrActionStatus("Shared.");
        setTimeout(() => setQrActionStatus(null), 2000);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(qrInfo.qrUrl);
        setQrActionStatus("QR string copied.");
        setTimeout(() => setQrActionStatus(null), 2000);
        return;
      }

      setQrActionStatus("Share not supported.");
    } catch (error) {
      console.error(error);
      setQrActionStatus("Failed to share.");
    }
  };
  const serviceItems = useMemo(() => {
    const multiplier = payment.prepayMonths || 1;
    return products
      .filter((product) => selection[product.id]?.selected)
      .map((product) => {
        const quantity = selection[product.id]?.quantity ?? 1;
        const total = product.unitPrice * quantity * multiplier;
        return {
          name: product.name,
          description: product.description,
          quantity,
          unitPrice: product.unitPrice,
          total,
        };
      });
  }, [products, selection, payment.prepayMonths]);

  const cameraChargeItems = useMemo(() => {
    return cameras
      .filter((camera) => camera.source === "stock")
      .map((camera) => {
        if (camera.stockMode === "batch" && camera.batchId) {
          const batch = cameraBatches.find((item) => item.id === camera.batchId);
          if (!batch) return [];
          const qty = Math.max(1, camera.quantity || 1);
          const items: InvoiceItem[] = [
            {
              name: `Camera hardware (${batch.model})`,
              description: `Batch ${batch.id}`,
              quantity: qty,
              unitPrice: batch.unitPrice,
              total: batch.unitPrice * qty,
            },
          ];
          const installFee = Number(batch.installationFee ?? 0);
          if (installFee > 0) {
            items.push({
              name: `Installation (${batch.model})`,
              description: `Install fee (batch ${batch.id})`,
              quantity: qty,
              unitPrice: installFee,
              total: installFee * qty,
            });
          }
          return items;
        }

        if (camera.stockId) {
          const stock = cameraStock.find((item) => item.id === camera.stockId);
          if (!stock) return [];
          const items: InvoiceItem[] = [
            {
              name: `Camera hardware (${stock.model})`,
              description: `Serial ${stock.serial}`,
              quantity: 1,
              unitPrice: stock.unitPrice,
              total: stock.unitPrice,
            },
          ];
          const installationFee = Number(stock.installationFee ?? 0);
          if (installationFee > 0) {
            items.push({
              name: `Installation (${stock.model})`,
              description: `Install fee for ${stock.serial}`,
              quantity: 1,
              unitPrice: installationFee,
              total: installationFee,
            });
          }
          return items;
        }
        return [];
      })
      .flat();
  }, [cameraStock, cameraBatches, cameras]);

  const invoiceItems = useMemo(() => {
    return [...serviceItems, ...cameraChargeItems];
  }, [serviceItems, cameraChargeItems]);

  const totalMoney = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  }, [invoiceItems]);

  const usedStockIds = useMemo(() => {
    return new Set(cameras.map((camera) => camera.stockId).filter(Boolean) as number[]);
  }, [cameras]);

  const teamOptions = useMemo(() => {
    if (!profile.provinceCode) return [];
    return TEAMS_BY_PROVINCE[profile.provinceCode] ?? [];
  }, [profile.provinceCode]);

  useEffect(() => {
    if (!profile.provinceCode) return;
    if (teamOptions.length === 0) return;
    if (profile.teamCode && teamOptions.includes(profile.teamCode)) return;
    setProfile((prev) => ({ ...prev, teamCode: teamOptions[0] ?? "" }));
  }, [profile.provinceCode, profile.teamCode, teamOptions]);

  const availableStock = useMemo(() => {
    return cameraStock.filter(
      (stock) =>
        (stock.status === "available" || usedStockIds.has(stock.id)) &&
        (!profile.provinceCode || stock.provinceCode === profile.provinceCode) &&
        (!profile.teamCode || stock.teamCode === profile.teamCode)
    );
  }, [cameraStock, usedStockIds, profile.provinceCode, profile.teamCode]);

  const availableCount = useMemo(() => {
    return cameraStock.filter(
      (stock) =>
        stock.status === "available" &&
        (!profile.provinceCode || stock.provinceCode === profile.provinceCode) &&
        (!profile.teamCode || stock.teamCode === profile.teamCode)
    ).length;
  }, [cameraStock, profile.provinceCode, profile.teamCode]);


  const availableBatches = useMemo(() => {
    return cameraBatches.filter(
      (batch) =>
        batch.quantityAvailable > 0 &&
        (!profile.provinceCode || batch.provinceCode === profile.provinceCode) &&
        (!profile.teamCode || batch.teamCode === profile.teamCode)
    );
  }, [cameraBatches, profile.provinceCode, profile.teamCode]);

  const availableBatchCount = useMemo(() => {
    return cameraBatches.filter(
      (batch) =>
        batch.quantityAvailable > 0 &&
        (!profile.provinceCode || batch.provinceCode === profile.provinceCode) &&
        (!profile.teamCode || batch.teamCode === profile.teamCode)
    ).length;
  }, [cameraBatches, profile.provinceCode, profile.teamCode]);

  const batchSummary = useMemo(() => {
    const summary = new Map<string, { available: number; assigned: number }>();
    availableBatches.forEach((batch) => {
      const key = batch.model || "unknown";
      const entry = summary.get(key) ?? { available: 0, assigned: 0 };
      entry.available += batch.quantityAvailable;
      entry.assigned += batch.quantityAssigned;
      summary.set(key, entry);
    });
    return Array.from(summary.entries()).map(([model, counts]) => ({
      model,
      available: counts.available,
      assigned: counts.assigned,
    }));
  }, [availableBatches]);

  const stockSummary = useMemo(() => {
    const filtered = cameraStock.filter((stock) => {
      if (profile.provinceCode && stock.provinceCode !== profile.provinceCode) return false;
      if (profile.teamCode && stock.teamCode !== profile.teamCode) return false;
      return true;
    });
    const summary = new Map<string, { available: number; assigned: number }>();
    filtered.forEach((stock) => {
      const key = stock.model || "unknown";
      const entry = summary.get(key) ?? { available: 0, assigned: 0 };
      if (stock.status === "available") entry.available += 1;
      if (stock.status === "assigned") entry.assigned += 1;
      summary.set(key, entry);
    });
    return Array.from(summary.entries()).map(([model, counts]) => ({
      model,
      available: counts.available,
      assigned: counts.assigned,
    }));
  }, [cameraStock, profile.provinceCode, profile.teamCode]);

  const isBusy = status.type === "loading";

  const isCameraRowEmpty = (camera: Camera) => {
    if (camera.source === "stock") {
      if (camera.stockMode === "batch") {
        return !camera.batchId;
      }
      return !camera.stockId;
    }
    return !camera.serial.trim() && !camera.model.trim() && !camera.location.trim();
  };

  const hasValidCamera = cameras.some((camera) => {
    if (camera.source === "stock") {
      if (camera.stockMode === "batch") {
        return Boolean(camera.batchId) && camera.quantity > 0;
      }
      return Boolean(camera.stockId);
    }
    return Boolean(camera.serial.trim());
  });

  const hasInvalidExistingCamera = cameras.some((camera) => {
    if (camera.source === "stock" || isCameraRowEmpty(camera)) return false;
    return !camera.serial.trim();
  });


  const hasInvalidBatchQuantity = cameras.some((camera) => {
    if (camera.source !== "stock" || camera.stockMode !== "batch" || !camera.batchId) {
      return false;
    }
    const batch = cameraBatches.find((item) => item.id === camera.batchId);
    if (!batch) return false;
    return camera.quantity > batch.quantityAvailable;
  });

  const canProceed =
    !isBusy &&
    (step !== 0 || serviceItems.length > 0) &&
    (step !== 1 || (customer.fullName && customer.email && profile.companyName)) &&
    (step !== 2 ||
      (hasValidCamera &&
        !hasInvalidExistingCamera &&
        profile.provinceCode &&
        profile.teamCode)) &&
    (step !== 3 || (contract.startDate && contract.termMonths));

  const handleSelectProduct = (id: string) => {
    setSelection((prev) => ({
      ...prev,
      [id]: { selected: !prev[id]?.selected, quantity: prev[id]?.quantity ?? 1 },
    }));
  };

  const handleQuantityChange = (id: string, value: number) => {
    setSelection((prev) => ({
      ...prev,
      [id]: { selected: prev[id]?.selected ?? false, quantity: normalizeQuantity(value) },
    }));
  };

  const handleCameraChange = (
    index: number,
    key: keyof Camera,
    value: string
  ) => {
    setCameras((prev) =>
      prev.map((camera, idx) =>
        idx === index ? { ...camera, [key]: value } : camera
      )
    );
  };

  const handleCameraSourceChange = (index: number, source: CameraSource) => {
    setCameras((prev) =>
      prev.map((camera, idx) => {
        if (idx !== index) return camera;
        if (source === "existing") {
          return {
            ...camera,
            source,
            stockMode: "serial",
            stockId: null,
            batchId: null,
            quantity: 1,
          };
        }
        return {
          ...camera,
          source,
          stockMode: camera.stockMode ?? "serial",
          stockId: camera.stockId ?? null,
          batchId: camera.batchId ?? null,
          quantity: camera.quantity || 1,
        };
      })
    );
  };


  const handleCameraStockModeChange = (index: number, mode: CameraStockMode) => {
    setCameras((prev) =>
      prev.map((camera, idx) => {
        if (idx !== index) return camera;
        if (mode === "serial") {
          return {
            ...camera,
            stockMode: mode,
            stockId: null,
            batchId: null,
            quantity: 1,
          };
        }
        return {
          ...camera,
          stockMode: mode,
          stockId: null,
          batchId: null,
          quantity: camera.quantity || 1,
        };
      })
    );
  };

  const handleCameraBatchSelect = (index: number, batchId: number | null) => {
    const batch = cameraBatches.find((item) => item.id === batchId);
    setCameras((prev) =>
      prev.map((camera, idx) =>
        idx === index
          ? {
              ...camera,
              source: "stock",
              stockMode: "batch",
              batchId,
              stockId: null,
              model: batch?.model ?? camera.model,
              serial: "",
              quantity: camera.quantity || 1,
            }
          : camera
      )
    );
  };

  const handleCameraQuantityChange = (index: number, value: number) => {
    const qty = Math.max(1, Math.floor(value || 1));
    setCameras((prev) =>
      prev.map((camera, idx) => (idx === index ? { ...camera, quantity: qty } : camera))
    );
  };

  const handleCameraStockSelect = (index: number, stockId: number | null) => {
    const stock = cameraStock.find((item) => item.id === stockId);
    setCameras((prev) =>
      prev.map((camera, idx) =>
        idx === index
          ? {
              ...camera,
              source: "stock",
              stockMode: "serial",
              stockId,
              batchId: null,
              quantity: 1,
              serial: stock?.serial ?? camera.serial,
              model: stock?.model ?? camera.model,
            }
          : camera
      )
    );
  };

  const handleAddCamera = () => {
    setCameras((prev) => [
      ...prev,
      {
        serial: "",
        model: "",
        location: "",
        source: "existing",
        stockMode: "serial",
        stockId: null,
        batchId: null,
        quantity: 1,
      },
    ]);
  };

  const handleRemoveCamera = (index: number) => {
    setCameras((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleResetWorkflow = () => {
    setStep(0);
    setStatus({ type: "idle" });
    setCustomer(initialCustomer);
    setCameras(initialCameras);
    setContract(initialContract);
    setProfile(initialProfile);
    setPayment(initialPayment);
    setContext(initialContext);
    setQrInfo(null);
    setLastFailedTrace(null);
    if (products.length > 0) {
      setSelection(buildSelection(products));
    }
    clearDraft();
  };

  const validateStep = () => {
    if (step === 0 && serviceItems.length === 0) {
      setStatus({ type: "error", message: "Select at least one package." });
      return false;
    }
    if (
      step === 1 &&
      (!customer.fullName || !customer.email || !profile.companyName)
    ) {
      setStatus({
        type: "error",
        message: "Customer name, email, and company are required.",
      });
      return false;
    }
    if (step === 2 && (!hasValidCamera || hasInvalidExistingCamera || hasInvalidBatchQuantity || !profile.provinceCode || !profile.teamCode)) {
      setStatus({
        type: "error",
        message:
          !profile.provinceCode || !profile.teamCode
            ? "Province and technical team are required for camera registration."
            : hasInvalidExistingCamera
              ? "Existing cameras must include a serial number."
              : "Register at least one camera before continuing.",
      });
      return false;
    }
    if (step === 3 && (!contract.startDate || !contract.termMonths)) {
      setStatus({
        type: "error",
        message: "Contract start date and term are required.",
      });
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    if (step === 3) {
      setStatus({ type: "loading", message: "Preparing invoice..." });
      const cameraSummary = cameras
        .filter((camera) => !isCameraRowEmpty(camera))
        .map((camera) => {
          const stock =
            camera.source === "stock" && camera.stockMode === "serial"
              ? cameraStock.find((item) => item.id === camera.stockId)
              : null;
          const batch =
            camera.source === "stock" && camera.stockMode === "batch"
              ? cameraBatches.find((item) => item.id === camera.batchId)
              : null;
          const serial = stock?.serial ?? (camera.stockMode === "batch" ? "BATCH" : camera.serial ?? "CAM");
          const model = stock?.model ?? batch?.model ?? camera.model ?? "";
          const qtyLabel = camera.stockMode === "batch" ? `x${camera.quantity}` : "";
          const parts = [
            serial,
            model ? `- ${model}` : "",
            qtyLabel ? `${qtyLabel}` : "",
            camera.location ? `(${camera.location})` : "",
            camera.source === "stock" ? "[stock]" : "[existing]",
          ];
          return parts.filter(Boolean).join(" ");
        })
        .join("; ");
      const locationNotes = [
        profile.provinceCode && `Province: ${profile.provinceCode}`,
        profile.teamCode && `Team: ${profile.teamCode}`,
      ]
        .filter(Boolean)
        .join(" | ");

      const contractNotes = [
        profile.notes,
        locationNotes,
        cameraSummary && `Cameras: ${cameraSummary}`,
      ]
        .filter(Boolean)
        .join(" | ");
      const subscriberResult = await apiFetch<{ id: string }>("/api/fixed-development/subscribers", {
        method: "POST",
        body: {
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone || undefined,
          address: customer.address || undefined,
          profile,
        },
      });

      if (!subscriberResult.ok) {
        setStatus({ type: "error", message: subscriberResult.error, traceId: subscriberResult.traceId });
        setLastFailedTrace(subscriberResult.traceId ?? null);
        return;
      }

      const subscriberId = subscriberResult.data.id;

      const contractResult = await apiFetch<{ id: string }>("/api/fixed-development/contracts", {
        method: "POST",
        body: {
          subscriberId,
          productIds: products
            .filter((product) => selection[product.id]?.selected)
            .map((product) => product.id),
          startDate: contract.startDate,
          termMonths: contract.termMonths,
          billingCycle: contract.billingCycle,
          status: "active",
          notes: contractNotes || undefined,
        },
      });

      if (!contractResult.ok) {
        setStatus({ type: "error", message: contractResult.error, traceId: contractResult.traceId });
        setLastFailedTrace(contractResult.traceId ?? null);
        return;
      }

      const contractId = contractResult.data.id;

      const invoiceResult = await apiFetch<Invoice>("/api/fixed-development/invoices", {
        method: "POST",
        body: {
          subscriberId,
          contractId,
          items: invoiceItems,
          autoInvoice: payment.autoInvoice,
        },
      });

      if (!invoiceResult.ok) {
        setStatus({ type: "error", message: invoiceResult.error, traceId: invoiceResult.traceId });
        setLastFailedTrace(invoiceResult.traceId ?? null);
        return;
      }

      setContext({ subscriberId, contractId, invoice: invoiceResult.data });
      setStatus({ type: "success", message: "Invoice ready for payment." });
    }

    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setStatus({ type: "idle" });
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleToggleAutoInvoice = async () => {
    const nextValue = !payment.autoInvoice;
    setPayment((prev) => ({ ...prev, autoInvoice: nextValue }));

    if (context.invoice) {
      await apiFetch(`/api/fixed-development/invoices/${context.invoice.id}`, {
        method: "PATCH",
        body: { autoInvoice: nextValue },
      });
      setContext((prev) => ({
        ...prev,
        invoice: prev.invoice ? { ...prev.invoice, autoInvoice: nextValue } : prev.invoice,
      }));
    }
  };

  const handleGenerateQr = async () => {
    if (!context.subscriberId || !context.invoice) {
      setStatus({ type: "error", message: "Invoice not ready for QR payment." });
      return;
    }

    setStatus({ type: "loading", message: "Generating QR payment..." });

    const result = await apiFetch<{ qrUrl: string; qrReference: string; traceId: string }>(
      "/api/subscribers/create-qr-connect-network-product-order",
      {
        method: "POST",
        body: {
          subscriberId: context.subscriberId,
          invoiceId: context.invoice.id,
          amount: totalMoney,
        },
      }
    );

    if (!result.ok) {
      setStatus({ type: "error", message: result.error, traceId: result.traceId });
      setLastFailedTrace(result.traceId ?? null);
      return;
    }

    setQrInfo(result.data);
    setStatus({ type: "success", message: "QR payment created." });
  };

  const handleSubmitPayment = async (methodOverride?: string) => {
    if (!context.subscriberId || !context.invoice) {
      setStatus({ type: "error", message: "Invoice not ready for payment." });
      return;
    }

    const method = methodOverride ?? payment.method;

    setStatus({ type: "loading", message: "Submitting payment..." });

    const result = await apiFetch(`/api/subscribers/${context.subscriberId}/payment`, {
      method: "POST",
      body: {
        invoiceId: context.invoice.id,
        method,
        amount: totalMoney,
        qrReference: qrInfo?.qrReference,
        simulateFailure: payment.simulateFailure,
        traceId: lastFailedTrace ?? undefined,
      },
    });

    if (!result.ok) {
      setStatus({ type: "error", message: result.error, traceId: result.traceId });
      setLastFailedTrace(result.traceId ?? null);
      return;
    }

    const stockSelections = cameras
      .filter((camera) => camera.source === "stock" && camera.stockMode === "serial" && camera.stockId)
      .map((camera) => camera.stockId as number)
      .filter((stockId) => {
        const stock = cameraStock.find((item) => item.id === stockId);
        return stock && stock.status === "available";
      });

    if (stockSelections.length > 0) {
      const assignedAt = new Date().toISOString();
      await Promise.allSettled(
        stockSelections.map((stockId) =>
          apiFetch(`/api/fixed-development/camera_stock/${stockId}`, {
            method: "PATCH",
            body: {
              status: "assigned",
              assignedSubscriberId: context.subscriberId,
              assignedContractId: context.contractId,
              assignedAt,
            },
          })
        )
      );
      setCameraStock((prev) =>
        prev.map((stock) =>
          stockSelections.includes(stock.id)
            ? {
                ...stock,
                status: "assigned",
                assignedSubscriberId: context.subscriberId,
                assignedContractId: context.contractId,
                assignedAt,
              }
            : stock
        )
      );
    }


    const batchSelections = cameras
      .filter((camera) => camera.source === "stock" && camera.stockMode === "batch" && camera.batchId)
      .map((camera) => ({
        batchId: camera.batchId as number,
        quantity: Math.max(1, camera.quantity || 1),
      }));

    if (batchSelections.length > 0) {
      await Promise.allSettled(
        batchSelections.map((selection) => {
          const batch = cameraBatches.find((item) => item.id === selection.batchId);
          if (!batch) return Promise.resolve();
          const nextAvailable = Math.max(0, batch.quantityAvailable - selection.quantity);
          const nextAssigned = batch.quantityAssigned + selection.quantity;
          return apiFetch(`/api/fixed-development/camera_stock_batches/${selection.batchId}`, {
            method: "PATCH",
            body: {
              quantityAvailable: nextAvailable,
              quantityAssigned: nextAssigned,
            },
          });
        })
      );

      setCameraBatches((prev) =>
        prev.map((batch) => {
          const selection = batchSelections.find((item) => item.batchId === batch.id);
          if (!selection) return batch;
          return {
            ...batch,
            quantityAvailable: Math.max(0, batch.quantityAvailable - selection.quantity),
            quantityAssigned: batch.quantityAssigned + selection.quantity,
          };
        })
      );
    }

    setStatus({ type: "success", message: "Payment processed successfully." });
    setLastFailedTrace(null);
  };

  const handleExportCsv = () => {
    const headers = ["Item", "Description", "Quantity", "Unit Price", "Total"];
    const rows = invoiceItems.map((item) => [
      item.name,
      item.description,
      String(item.quantity),
      String(item.unitPrice),
      String(item.total),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice-preview.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--text)]">
            Subscriber onboarding workflow
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Multi-step onboarding with camera packages, invoices, and payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone="neutral">Step {step + 1} of {steps.length}</StatusBadge>
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
            type="button"
            onClick={handleResetWorkflow}
          >
            Reset workflow
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[var(--shadow)]">
        <StepIndicator steps={steps} current={step} />
        <div className="mt-6">
          {step === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">Cloud package selection</p>
                  <p className="text-sm text-[var(--muted)]">
                    Select storage packages and number of cameras.
                  </p>
                </div>
                <StatusBadge tone="neutral">{serviceItems.length} selected</StatusBadge>
              </div>
              {isLoadingProducts ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                  Loading packages...
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted)]">
                  No packages available yet.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`rounded-2xl border p-4 ${
                        selection[product.id]?.selected
                          ? "border-transparent bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{product.name}</p>
                          <p className="text-xs text-[var(--muted)]">
                            {product.description}
                          </p>
                          <p className="mt-2 text-sm font-semibold">
                            ${product.unitPrice.toFixed(2)} / {product.billingCycle}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={selection[product.id]?.selected ?? false}
                          onChange={() => handleSelectProduct(product.id)}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="text-[var(--muted)]">Cameras</span>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          inputMode="numeric"
                          className="w-20 rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                          value={selection[product.id]?.quantity ?? 1}
                          onChange={(event) =>
                            handleQuantityChange(product.id, Number(event.target.value))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-1 text-sm font-semibold">
                Subscriber full name
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={customer.fullName}
                  onChange={(event) =>
                    setCustomer((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Email address
                <input
                  type="email"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={customer.email}
                  onChange={(event) =>
                    setCustomer((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Phone
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={customer.phone}
                  onChange={(event) =>
                    setCustomer((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Address
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={customer.address}
                  onChange={(event) =>
                    setCustomer((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Company / Organization
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={profile.companyName}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, companyName: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Tax ID / National ID
                <input
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={profile.taxId}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, taxId: event.target.value }))
                  }
                />
              </label>              <label className="space-y-1 text-sm font-semibold lg:col-span-2">
                Notes
                <textarea
                  className="min-h-[110px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={profile.notes}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </label>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">Camera registration</p>
                  <p className="text-sm text-[var(--muted)]">
                    Register camera serials, models, and locations.
                  </p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  <label className="space-y-1 text-sm font-semibold">
                    Province
                    <select
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      value={profile.provinceCode}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          provinceCode: event.target.value,
                          teamCode: "",
                        }))
                      }
                    >
                      <option value="">Select province</option>
                      {PROVINCES.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.code} - {province.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-semibold">
                    Technical team
                    <select
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      value={profile.teamCode}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, teamCode: event.target.value }))
                      }
                      disabled={!profile.provinceCode || teamOptions.length === 0}
                    >
                      <option value="">Select team</option>
                      {teamOptions.map((team) => (
                        <option key={team} value={team}>
                          {team}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm font-semibold">
                    Segment
                    <select
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                      value={profile.segment}
                      onChange={(event) =>
                        setProfile((prev) => ({ ...prev, segment: event.target.value }))
                      }
                    >
                      <option value="enterprise">Enterprise</option>
                      <option value="midmarket">Mid-market</option>
                      <option value="smb">SMB</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={isLoadingStock || isLoadingBatches ? "neutral" : "ok"}>
                    {isLoadingStock || isLoadingBatches
                      ? "Loading stock"
                      : profile.teamCode
                        ? `${availableCount} serial + ${availableBatchCount} batch in ${profile.teamCode}`
                        : `${availableCount} serial + ${availableBatchCount} batch`}
                  </StatusBadge>
                  <button
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                    type="button"
                    onClick={handleAddCamera}
                  >
                    Add camera
                  </button>
                </div>
              </div>
              {!profile.teamCode ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
                  Select a province and technical team to load stock for that site.
                </div>
              ) : null}
              {!isLoadingStock && !isLoadingBatches && availableCount + availableBatchCount === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted)]">
                  No camera stock available yet. Add stock in Data Admin to select
                  from inventory.
                </div>
              ) : null}
              {batchSummary.length > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Batch stock by model
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {batchSummary.map((entry) => (
                      <span
                        key={entry.model}
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted)]"
                      >
                        {entry.model}: {entry.available} available / {entry.assigned} assigned
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {stockSummary.length > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Available stock by model
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stockSummary.map((entry) => (
                      <span
                        key={entry.model}
                        className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--muted)]"
                      >
                        {entry.model}: {entry.available} available / {entry.assigned} assigned
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-left">Stock mode</th>
                      <th className="px-4 py-3 text-left">Stock item</th>
                      <th className="px-4 py-3 text-left">Serial</th>
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Qty</th>
                      <th className="px-4 py-3 text-left">Charge</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cameras.map((camera, index) => (
                      <tr key={index} className="border-t border-[var(--border)]">
                        <td className="px-4 py-3">
                          <select
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                            value={camera.source}
                            onChange={(event) =>
                              handleCameraSourceChange(
                                index,
                                event.target.value as CameraSource
                              )
                            }
                          >
                            <option value="existing">Existing</option>
                            <option value="stock">From stock</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {camera.source === "stock" ? (
                            <select
                              className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                              value={camera.stockMode}
                              onChange={(event) =>
                                handleCameraStockModeChange(
                                  index,
                                  event.target.value as CameraStockMode
                                )
                              }
                            >
                              <option value="serial">Serial</option>
                              <option value="batch">Quantity</option>
                            </select>
                          ) : (
                            <span className="text-xs text-[var(--muted)]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {camera.source === "stock" ? (
                            camera.stockMode === "batch" ? (
                              <select
                                className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                                value={camera.batchId ?? ""}
                                onChange={(event) =>
                                  handleCameraBatchSelect(
                                    index,
                                    event.target.value ? Number(event.target.value) : null
                                  )
                                }
                              >
                                <option value="">Select batch</option>
                                {availableBatches.map((batch) => (
                                  <option key={batch.id} value={batch.id}>
                                    Batch {batch.id} - {batch.model} - {batch.teamCode ?? batch.provinceCode ?? "N/A"} - Qty {batch.quantityAvailable}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <select
                                className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                                value={camera.stockId ?? ""}
                                onChange={(event) =>
                                  handleCameraStockSelect(
                                    index,
                                    event.target.value ? Number(event.target.value) : null
                                  )
                                }
                              >
                                <option value="">Select stock</option>
                                {availableStock.map((stock) => {
                                  const isTaken =
                                    usedStockIds.has(stock.id) && stock.id !== camera.stockId;
                                  return (
                                    <option key={stock.id} value={stock.id} disabled={isTaken}>
                                      {stock.serial} - {stock.model} - {stock.teamCode ?? stock.provinceCode ?? "N/A"} - ${stock.unitPrice.toFixed(2)}
                                    </option>
                                  );
                                })}
                              </select>
                            )
                          ) : (
                            <span className="text-xs text-[var(--muted)]">Customer owned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                            placeholder="CAM-001"
                            value={camera.serial}
                            onChange={(event) =>
                              handleCameraChange(index, "serial", event.target.value)
                            }
                            disabled={camera.source === "stock"}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                            placeholder="Dome 4MP"
                            value={camera.model}
                            onChange={(event) =>
                              handleCameraChange(index, "model", event.target.value)
                            }
                            disabled={camera.source === "stock"}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                            placeholder="Entrance"
                            value={camera.location}
                            onChange={(event) =>
                              handleCameraChange(index, "location", event.target.value)
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {camera.source === "stock" && camera.stockMode === "batch" ? (
                            <input
                              type="number"
                              min={1}
                              max={(() => {
                                const batch = cameraBatches.find((item) => item.id === camera.batchId);
                                return batch?.quantityAvailable ?? undefined;
                              })()}
                              className="w-full rounded-lg border border-[var(--border)] px-2 py-1 text-sm"
                              value={camera.quantity}
                              onChange={(event) =>
                                handleCameraQuantityChange(index, Number(event.target.value))
                              }
                            />
                          ) : (
                            <span className="text-xs text-[var(--muted)]">1</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-sm text-[var(--muted)]">
                          {camera.source === "stock" ? (() => {
                            if (camera.stockMode === "batch" && camera.batchId) {
                              const batch = cameraBatches.find((item) => item.id === camera.batchId);
                              const installFee = Number(batch?.installationFee ?? 0);
                              const qty = Math.max(1, camera.quantity || 1);
                              const total = (Number(batch?.unitPrice ?? 0) + installFee) * qty;
                              return `$${total.toFixed(2)}`;
                            }
                            if (camera.stockId) {
                              const stock = cameraStock.find(
                                (item) => item.id === camera.stockId
                              );
                              const installFee = Number(stock?.installationFee ?? 0);
                              const total = Number(stock?.unitPrice ?? 0) + installFee;
                              return `$${total.toFixed(2)}`;
                            }
                            return "$0.00";
                          })() : "$0.00"}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--muted)]"
                            type="button"
                            onClick={() => handleRemoveCamera(index)}
                            disabled={cameras.length === 1}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="space-y-1 text-sm font-semibold">
                Contract start date
                <input
                  type="date"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={contract.startDate}
                  onChange={(event) =>
                    setContract((prev) => ({ ...prev, startDate: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Term (months)
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={contract.termMonths}
                  onChange={(event) =>
                    setContract((prev) => ({ ...prev, termMonths: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm font-semibold">
                Billing cycle
                <select
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
                  value={contract.billingCycle}
                  onChange={(event) =>
                    setContract((prev) => ({ ...prev, billingCycle: event.target.value }))
                  }
                >
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Annual</option>
                </select>
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-sm font-semibold">Payment method</p>
                  <div className="mt-3 space-y-2 text-sm">
                    {[
                      { value: "cash", label: "Cash" },
                      { value: "qr", label: "QR Code" },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="payment-method"
                          value={option.value}
                          checked={payment.method === option.value}
                          onChange={() =>
                            setPayment((prev) => ({ ...prev, method: option.value }))
                          }
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <label className="mt-4 flex items-center gap-2 text-xs text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={payment.simulateFailure}
                      onChange={(event) =>
                        setPayment((prev) => ({ ...prev, simulateFailure: event.target.checked }))
                      }
                    />
                    Simulate gateway failure
                  </label>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-sm font-semibold">Automatic invoicing</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Automatically create invoice each billing cycle.
                  </p>
                  <label className="mt-4 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={payment.autoInvoice}
                      onChange={handleToggleAutoInvoice}
                    />
                    Enable automatic invoicing
                  </label>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-sm font-semibold">Prepaid bundle</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Apply prepaid months to total invoice.
                  </p>
                  <select
                    className="mt-3 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
                    value={payment.prepayMonths}
                    onChange={(event) =>
                      setPayment((prev) => ({ ...prev, prepayMonths: Number(event.target.value) }))
                    }
                  >
                    <option value={1}>Monthly</option>
                    <option value={3}>Prepaid 3 months</option>
                    <option value={6}>Prepaid 6 months</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">Invoice preview</p>
                    <p className="text-sm text-[var(--muted)]">
                      Review line items before payment.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                      type="button"
                      onClick={handleExportCsv}
                    >
                      Export CSV
                    </button>
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                      type="button"
                      onClick={() => window.print()}
                    >
                      Export PDF
                    </button>
                  </div>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--card)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-left">Qty</th>
                        <th className="px-4 py-3 text-left">Unit Price</th>
                        <th className="px-4 py-3 text-left">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceItems.map((item) => (
                        <tr key={item.name} className="border-t border-[var(--border)]">
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3 text-[var(--muted)]">
                            {item.description}
                          </td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3">${item.unitPrice.toFixed(2)}</td>
                          <td className="px-4 py-3">${item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Total money</span>
                  <span className="text-lg font-semibold">${totalMoney.toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">Payment processing</p>
                    <p className="text-sm text-[var(--muted)]">
                      Trigger server-side payment requests and handle errors.
                    </p>
                  </div>
                  {qrInfo ? (
                    <StatusBadge tone="ok">QR ready</StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">Awaiting payment</StatusBadge>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {payment.method === "qr" ? (
                    <button
                      className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
                      type="button"
                      onClick={handleGenerateQr}
                      disabled={isBusy}
                    >
                      Generate QR
                    </button>
                  ) : null}
                  <button
                    className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-sm font-semibold text-[var(--primary)]"
                    type="button"
                    onClick={() => handleSubmitPayment()}
                    disabled={isBusy}
                  >
                    Submit payment
                  </button>
                  {lastFailedTrace ? (
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
                      type="button"
                      onClick={() => handleSubmitPayment()}
                      disabled={isBusy}
                    >
                      Retry with trace
                    </button>
                  ) : null}
                </div>
                {qrInfo ? (
                  <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm">
                    <p className="font-semibold">QR Reference: {qrInfo.qrReference}</p>
                    <p className="text-[var(--muted)]">Trace ID: {qrInfo.traceId}</p>
                    <p className="text-[var(--muted)]">QR URL: {qrInfo.qrUrl}</p>
                    <div
                      className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-white p-4"
                      ref={qrContainerRef}
                    >
                      <QRCode value={qrInfo.qrUrl} size={180} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-xs font-semibold text-[var(--primary)]"
                        type="button"
                        onClick={handleSaveQr}
                        disabled={isBusy}
                      >
                        Save QR
                      </button>
                      <button
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--muted)]"
                        type="button"
                        onClick={handleShareQr}
                        disabled={isBusy}
                      >
                        Share
                      </button>
                      {qrActionStatus ? (
                        <span className="inline-flex items-center text-xs text-[var(--muted)]">
                          {qrActionStatus}
                        </span>
                      ) : null}
                    </div>
                    <button
                      className="mt-3 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
                      type="button"
                      onClick={() => handleSubmitPayment("qr")}
                      disabled={isBusy}
                    >
                      Mark as paid
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {status.type !== "idle" ? (
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge tone={status.type === "error" ? "danger" : "ok"}>
              {status.type}
            </StatusBadge>
            <span>{status.message}</span>
            {status.traceId ? (
              <span className="text-xs text-[var(--muted)]">
                Trace: {status.traceId}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            type="button"
            onClick={handlePrev}
            disabled={step === 0 || isBusy}
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
            >
              Next step
            </button>
          ) : null}
        </div>
      </section>
    </>
  );
}
