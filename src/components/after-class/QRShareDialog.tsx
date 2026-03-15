import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode.react';

interface QRShareDialogProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function QRShareDialog({ open, onClose, shareUrl }: QRShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#2c3e2c]">分享给手机</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center py-6">
          <QRCode value={shareUrl} size={200} level="H" includeMargin />
          <p className="mt-4 text-sm text-[#5a6b5a] text-center">
            使用手机扫码，快速录入错题
          </p>
          <p className="mt-2 text-xs text-[#8a9a8a] break-all">{shareUrl}</p>
          <Button variant="outline" className="mt-4" onClick={onClose}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}