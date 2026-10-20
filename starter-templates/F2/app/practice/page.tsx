import Link from 'next/link';
import PracticeForm from './practice-form';
export default function Practice() {
  return <>
    <Link href="/" className="text-sm text-[#356e5d] underline underline-offset-4">← トップへ</Link>
    <p className="mt-9 mb-4 text-sm font-semibold tracking-widest text-[#356e5d]">02 / 入力の練習</p>
    <h1 className="text-3xl font-bold md:text-4xl">今、つくりたいものは？</h1>
    <p className="mt-5 leading-8 text-[#53665d]">入力した文字が、そのまま下のカードに反映されます。<br />この入力はブラウザ内だけにあり、再読込で消えます。</p>
    <PracticeForm />
  </>;
}
