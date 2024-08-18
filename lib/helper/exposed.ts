const classes: Set<any> = new Set();

function exposed(t?: any): any {
  const stack = new Error().stack;
  const callerFile = stack?.split('\n')[2]?.match(/\((.*):[0-9]+:[0-9]+\)/)?.[2];
  const attach = (target: any = t) => {
    if (callerFile) {
      target.__file = callerFile;
    }
    target.__exposed = true;
    classes.add(target);
  };
  if (typeof t === 'function') {
    // Used as a decorator
    attach();
    return t;
  } else if (t) {
    // Used as a function
    const classesToExpose = Array.isArray(t) ? t : [t];
    classesToExpose.forEach(attach);
  } else {
    // Fallback for when expose is called with no arguments
    return function (target: any) {
      attach(target);
    };
  }
}

function getEx(): any[] {
  return Array.from(classes);
}

export { exposed, getEx };
