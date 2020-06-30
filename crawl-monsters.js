Array.from(document.querySelectorAll("h3 a"))
  .filter((a) => a.textContent.match(/Monsters \(/))
  .flatMap((a) => [...a.parentElement.nextElementSibling.querySelectorAll("a")])
  .filter((a) => {
    const text = a.textContent.trim().toLowerCase();
    return (
      !text.endsWith("combat") &&
      text.indexOf("characters") === -1 &&
      text.indexOf("creating") === -1 &&
      text.indexOf("training") === -1
    );
  })
  .map((a) => `        <li>${a.outerHTML}</li>`)
  .join("\n");
