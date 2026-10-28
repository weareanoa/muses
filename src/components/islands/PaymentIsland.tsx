import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { withBase } from '../../lib/paths';
import { formatRupiah } from '../../lib/format';
import { transactionService } from '../../services/transactionService';
import type { PaymentOrderSummary } from '../../types/database';

type PaymentOrder = PaymentOrderSummary;

const QR_MATRIX = [
  [1,1,1,1,1,1,1,0,1,0,1,1,0,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,0,1,0,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,1,0,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,0,0,0,0],
  [1,1,0,1,0,1,1,1,0,0,1,0,1,1,0,1,0,1,1,0,1],
  [0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0],
  [1,0,1,1,0,1,1,0,1,1,1,0,1,0,0,1,1,0,1,1,0],
  [0,1,0,0,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,1],
  [1,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,0],
  [0,0,0,0,0,0,0,0,1,0,1,1,0,1,1,0,1,0,1,1,1],
  [1,1,1,1,1,1,1,0,1,1,0,0,1,0,0,1,0,1,0,0,1],
  [1,0,0,0,0,0,1,0,0,1,1,1,0,1,1,0,1,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,0,1,0,1,1,0,1,0,0,1,1,1],
  [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,0,1,0],
  [1,0,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1],
  [1,0,0,0,0,0,1,0,1,0,1,1,0,1,1,0,1,1,1,0,0],
  [1,1,1,1,1,1,1,0,0,1,0,1,1,0,1,0,0,1,1,1,1],
];

export default function PaymentIsland() {
  const [order, setOrder] = useState<PaymentOrder>(() =>
    transactionService.getDefaultPaymentOrder()
  );
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const qrSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setOrder(transactionService.getActivePaymentOrder());
  }, []);

  const handleDownloadQR = () => {
    if (!qrSvgRef.current) return;
    try {
      const svgElement = qrSvgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL || window;
      const blobURL = URLObj.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, 600, 600);
          context.drawImage(image, 50, 50, 500, 500);
          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QRIS-${order.orderId}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      };
      image.src = blobURL;
    } catch {
      alert('QR Code dapat di-screenshot atau di-scan langsung dari layar.');
    }
  };

  const handleCheckStatus = () => {
    setIsChecking(true);
    setTimeout(async () => {
      await transactionService.verifyPayment(order.orderId);
      setIsChecking(false);
      setIsPaid(true);

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#D09F2B', '#E2B743', '#8C6A1C', '#ffffff'],
        });
      } catch {}
    }, 1200);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-[#FDF3D6] border border-[#EBD6A2] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-sm w-full max-w-sm">
            <div className="bg-[#E5BF58] text-[#3E2F0A] text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#1F1A12]" />
              <span>Menunggu Pembayaran</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EBD6A2]/40 mb-4 inline-block">
              <svg
                ref={qrSvgRef}
                viewBox="0 0 21 21"
                className="w-48 h-48 sm:w-52 sm:h-52 shape-rendering-crisp"
                fill="currentColor"
              >
                {QR_MATRIX.map((row, rIdx) =>
                  row.map((cell, cIdx) =>
                    cell === 1 ? (
                      <rect
                        key={`${rIdx}-${cIdx}`}
                        x={cIdx}
                        y={rIdx}
                        width="1"
                        height="1"
                        fill="#000000"
                      />
                    ) : null
                  )
                )}
              </svg>
            </div>

            <div className="w-full space-y-1">
              <p className="text-xs text-[#8A7F6C] font-mono">
                No. pesanan #{order.orderId}
              </p>
              <p className="text-xs font-medium text-[#70644D] pt-1">
                Total Pembayaran
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1F1A12]">
                {formatRupiah(order.total)}
              </p>
              <p className="text-[11px] text-[#8A7F6C]">
                Bayar sebelum <span className="font-mono font-medium text-[#1F1A12]">{order.deadline}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="bg-[#F5DE9B] hover:bg-[#EDD387] text-[#3E2F0A] font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh QR</span>
              </button>

              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isChecking}
                className="bg-[#F5DE9B] hover:bg-[#EDD387] text-[#3E2F0A] font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Mengecek...' : 'Cek status'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
              Cara Membayar
            </h2>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#856317] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-xs sm:text-sm text-[#42392B] leading-relaxed">
                  Buka aplikasi e-wallet atau m-banking yang kamu pakai.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#856317] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-xs sm:text-sm text-[#42392B] leading-relaxed">
                  Pilih menu bayar atau pindai, lalu arahkan kamera ke kode QR.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#856317] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-xs sm:text-sm text-[#42392B] leading-relaxed">
                  Pastikan nominalnya sesuai, lalu konfirmasi. Halaman ini akan berubah otomatis.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5 space-y-3.5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
              Ringkasan Pembayaran
            </h2>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs sm:text-sm">
                  <div>
                    <div className="font-bold text-[#1F1A12]">{item.name}</div>
                    <div className="text-[11px] text-[#8A7F6C]">
                      {item.subtitle} ({item.quantity}x)
                    </div>
                  </div>
                  <div className="font-bold text-[#1F1A12]">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center text-xs sm:text-sm text-[#70644D]">
                <span>Ongkos kirim</span>
                <span className="font-bold text-[#1F1A12]">
                  {formatRupiah(order.shippingFee)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm text-[#70644D]">
                <span>Biaya layanan & asuransi</span>
                <span className="font-bold text-[#1F1A12]">
                  {formatRupiah(order.platformFee)}
                </span>
              </div>
            </div>

            <hr className="border-t border-[#DFC478]/50 my-2" />

            <div className="flex justify-between items-center text-sm sm:text-base font-bold text-[#1F1A12]">
              <span>Total</span>
              <span>{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {isPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FCFAF5] border border-[#DFC478] rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#E5BF58]/20 border border-[#DFC478] flex items-center justify-center mx-auto text-[#8C6A1C]">
              <CheckCircle2 className="w-8 h-8 text-[#8C6A1C]" />
            </div>

            <h3 className="text-xl font-bold font-display text-[#1F1A12]">
              Pembayaran Berhasil!
            </h3>

            <p className="text-xs text-[#6E6453] leading-relaxed">
              Terima kasih! Pembayaran untuk pesanan #{order.orderId} senilai {formatRupiah(order.total)} telah berhasil diverifikasi.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <a
                href={withBase("/orders")}
                className="w-full py-3 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] hover:brightness-105 text-[#1F1A12] font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Lihat History Pesanan</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={withBase("/store")}
                className="w-full py-2.5 rounded-full border border-[#1F1A12]/15 text-[#6E6453] hover:text-[#1F1A12] font-semibold text-xs transition-colors"
              >
                Kembali ke Store
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
