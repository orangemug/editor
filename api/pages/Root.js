import React from "react";

export default function Home({Link}) {
	return <div>
		<nav>
      <h1>Examples</h1>
			<ul>
				<li>
					<Link page="simple">Simple</Link>
				</li>
				<li>
					<Link page="complex">Complex</Link>
				</li>
			</ul>
		</nav>
	</div>
}
