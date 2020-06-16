import React, {Fragment, useState, useEffect} from "react";

// Super unlikely to interfer with anything else.
const KEY = " ";

export default function qsRouter (pages) {
  if (!pages.root) {
    throw new Error("qsRouter: Must contain 'root'");
  }

  function getPage() {
    return (new URL(location)).searchParams.get(KEY) || 'root';
  }

  let onChange;

  function Link (props) {
    const url = new URL(location);
    url.searchParams.set(KEY, props.page);
    url.searchParams.sort();

    function onClick(e) {
      e.nativeEvent.preventDefault();
      const {page} = props;
      onChange(page);
      history.pushState({page}, document.title, url.href);
    }

    return (
      <a
        {...props}
        href={url.href}
        onClick={onClick}
      >
        {props.children}
      </a>
    );
  }

  function Router () {
    const [page, setPage] = useState(getPage());

    useEffect(() => {
      const hdl = (e) => {
        setPage(getPage());
      };

      onChange = (page) => {
        setPage(page);
      }

      window.addEventListener("popstate", hdl);
      return () => {
        window.removeEventListener("popstate", hdl);
      }
    });

    const defaultErr404 = () => <div>404</div>
    const Page = pages[page] || pages['err404'] || defaultErr404;
    return <>
      <Page Link={Link} />
    </>
  }

  return {Router, Link};
}

