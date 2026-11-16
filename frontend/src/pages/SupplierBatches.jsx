import { useState } from "react";
import { createPortal } from "react-dom";
import { X as LucideX } from "lucide-react";
import { FiArrowRight, FiCheck, FiGrid, FiTrash2 } from "react-icons/fi";
import "../styles/SupplierBatches.css";

const TRACE_CONNECT_LOGO_SRC = "/Traceconnect Logo.svg";

function SupplierBatchesList({ batches, navigate, removeBatch, setBatchModal }) {
  return batches.length > 0 ? (
    <div className="card supplier-batches-list">
      <div className="card-title"><FiGrid /> Your Batches</div>
      <div className="card-grid">
        {batches.map((batch) => (
          <div key={batch.id} className="batch-card" onClick={() => setBatchModal(batch)}>
            <div className="batch-card-top">
              <code className="batch-id">{batch.id}</code>
              <button
                className="icon-btn danger"
                type="button"
                aria-label={`Delete batch ${batch.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeBatch(batch.id);
                }}
              >
                <FiTrash2 />
              </button>
            </div>
            <div className="batch-weight">{batch.totalWeight} kg total</div>
            <p className="muted">{batch.description || "No description"} - {batch.createdAt}</p>
            <button
              className="btn btn-outline full-width mt"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/patch/${batch.id}`);
              }}
            >
              View Trace Page <FiArrowRight />
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="card supplier-batches-list">
      <div className="card-title"><FiGrid /> Your Batches</div>
      <div className="empty-state small"><p>No batches created yet.</p></div>
    </div>
  );
}

export default function SupplierBatches({
  batches,
  supplierId,
  navigate,
  removeBatch,
  dialog,
}) {
  const [batchModal, setBatchModal] = useState(null);
  const mine = batches.filter((batch) => Number(batch.supplierId) === Number(supplierId));

  return (
    <div className="page-container supplier-dashboard-page supplier-batches-page">
      {dialog}
      <SupplierBatchesList
        batches={mine}
        navigate={navigate}
        removeBatch={removeBatch}
        setBatchModal={setBatchModal}
      />
      {batchModal && (
        <SupplierBatchModal
          batch={batchModal}
          onClose={() => setBatchModal(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
}

export function SupplierBatchModal({ batch, onClose, navigate }) {
  const qrValue = `${window.location.origin}/patch/${batch.id}`;

  return createPortal(
    <div className="tc-root">
      <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
        <div className="modal-box batch-modal">
          <button className="modal-close" type="button" onClick={onClose}>
            <LucideX aria-hidden="true" />
          </button>
          <div className="batch-modal-header">
            <div className="batch-modal-icon"><FiCheck /></div>
            <h3>Batch Created!</h3>
          </div>
          <div className="qr-box">
            <div className="qr-shell">
              <QRCode value={qrValue} size={188} />
              <span className="qr-logo-mark">
                <img src={TRACE_CONNECT_LOGO_SRC} alt="" />
              </span>
            </div>
            <span className="qr-caption">Scan to open batch trace</span>
          </div>
          <div className="batch-modal-info">
            <div className="kv-pair"><span>Batch ID</span><code>{batch.id}</code></div>
            <div className="kv-pair"><span>Total Weight</span><strong>{batch.totalWeight} kg</strong></div>
            <div className="kv-pair"><span>Description</span><strong>{batch.description || "-"}</strong></div>
            <div className="kv-pair"><span>Created</span><strong>{batch.createdAt}</strong></div>
            <div className="kv-pair"><span>Items</span><strong>{batch.packingIds.length} packings</strong></div>
          </div>
          <button
            className="btn btn-primary full-width"
            type="button"
            onClick={() => {
              onClose();
              navigate(`/patch/${batch.id}`);
            }}
          >
            View Public Trace Page <FiArrowRight />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QRCode({ value, size = 160 }) {
  const cells = 25;
  const quiet = 2;
  const cell = size / (cells + quiet * 2);
  const moduleSize = cell * 0.76;
  const offset = (cell - moduleSize) / 2;
  const hash = (text) => {
    let result = 0;
    for (let index = 0; index < text.length; index += 1) {
      result = (result * 31 + text.charCodeAt(index)) & 0xffffffff;
    }
    return result >>> 0;
  };
  const isFinder = (row, column) =>
    (row < 7 && column < 7) ||
    (row < 7 && column >= cells - 7) ||
    (row >= cells - 7 && column < 7);
  const grid = Array.from({ length: cells }, (_, row) =>
    Array.from({ length: cells }, (_, column) => {
      if (isFinder(row, column)) return false;
      return ((hash(value + row * 100 + column) >> (column % 30)) & 1) === 1;
    }),
  );
  const finderPositions = [
    [0, 0],
    [cells - 7, 0],
    [0, cells - 7],
  ];
  const finderSize = cell * 7;

  return (
    <svg
      className="modern-qr"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Batch QR code"
    >
      <rect width={size} height={size} rx="18" fill="#ffffff" />
      {finderPositions.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${(x + quiet) * cell} ${(y + quiet) * cell})`}>
          <rect width={finderSize} height={finderSize} rx={cell * 1.4} fill="#0f8d75" />
          <rect x={cell} y={cell} width={cell * 5} height={cell * 5} rx={cell} fill="#ffffff" />
          <rect x={cell * 2} y={cell * 2} width={cell * 3} height={cell * 3} rx={cell * 0.75} fill="#10251b" />
        </g>
      ))}
      {grid.map((row, rowIndex) =>
        row.map((on, columnIndex) =>
          on ? (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={(columnIndex + quiet) * cell + offset}
              y={(rowIndex + quiet) * cell + offset}
              width={moduleSize}
              height={moduleSize}
              rx={moduleSize * 0.3}
              fill={(rowIndex + columnIndex) % 5 === 0 ? "#1d7dd8" : "#10251b"}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
