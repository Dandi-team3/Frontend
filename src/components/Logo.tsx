type LogoProps = {
  size?: 'md' | 'sm';
};

/** 로고 B안 "단단한" · Black Han Sans, 남색 글자 + 하늘색 점 */
export default function Logo({ size = 'md' }: LogoProps) {
  return (
    <span className={size === 'sm' ? 'logo sm' : 'logo'} role="img" aria-label="물려받기">
      물려
      <i aria-hidden="true" />
      받기
    </span>
  );
}
