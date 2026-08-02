import { createRouteHref } from '../core/navigation';

export function NotFoundPage() {
  return (
    <section className="not-found page-wrap">
      <p className="page-kicker">404</p>
      <h1>未找到工具</h1>
      <p className="page-lede">这个工具不存在，或链接已经发生变化。</p>
      <a className="primary-link" href={createRouteHref('/')}>返回工具目录</a>
    </section>
  );
}
