import React from "react";
import unified from 'unified';
import markdown from 'remark-parse';
import remark2rehype from 'remark-rehype';
import rehype2react from 'rehype-react';

import './Root.scss';
import readme from '../README.md'


var processor = unified()
  .use(markdown)
  .use(remark2rehype)
  .use(rehype2react, {createElement: React.createElement})

export default function Home({Link}) {
	return <div className="Root">
    <nav className="Nav">
      Maputnik
    </nav>
		<div className="Markdown">
      <h1>Examples</h1>
			<ul>
				<li>
					<Link page="simple">Simple</Link>
				</li>
				<li>
					<Link page="complex">Complex</Link>
				</li>
			</ul>
		</div>
    <div className="Markdown">
      {processor.processSync(readme).result}
    </div>
	</div>
}
