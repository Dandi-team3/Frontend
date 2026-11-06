import { useEffect, useRef, useState } from 'react';
import { loadPostcode, type PostcodeResult } from '../lib/postcode';
import FlowDialog from './FlowDialog';
import './AddressSearchDialog.css';

const RESIZE_BUFFER = 160;

type AddressSearchDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (result: PostcodeResult) => void;
};

export default function AddressSearchDialog({ open, onClose, onSelect }: AddressSearchDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setFailed(false);

    loadPostcode().then(() => {
      const container = containerRef.current;
      if (cancelled || !container || !window.daum) return;
      new window.daum.Postcode({
        width: '100%',
        height: '100%',
        theme: { searchBgColor: '#0D4A73', queryTextColor: '#FFFFFF' },
        oncomplete: (result) => onSelectRef.current(result),
        // iframe을 내용 높이만큼 늘려, 스크롤을 스크롤바가 숨겨진 바깥 박스에 맡긴다.
        // 검색 결과에서는 입력창·안내문 높이가 빠진 값이 오므로 여유를 더한다.
        onresize: ({ height }) => { container.style.height = `${height + RESIZE_BUFFER}px`; },
      }).embed(container);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      containerRef.current?.replaceChildren();
      containerRef.current?.style.removeProperty('height');
    };
  }, [open]);

  return (
    <FlowDialog open={open} title="가게 주소 검색" onClose={onClose}>
      {failed ? (
        <p className="flow-error" role="alert">주소 검색을 불러오지 못했어요. 지역과 주소를 직접 입력해 주세요.</p>
      ) : (
        <div className="address-search-frame">
          <div ref={containerRef} className="address-search-embed" />
        </div>
      )}
      <div className="flow-dialog-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>닫기</button>
      </div>
    </FlowDialog>
  );
}
