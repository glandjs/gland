const classes: Set<any> = new Set();

function exposed(t?: any): any {
  const attach = (target: any = t) => {
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
