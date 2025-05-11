import 'mocha';
import { expect } from 'chai';
import { Module } from '../../packages/core/injector/module';
import { InstanceWrapper } from '../../packages/core/injector/instance-wrapper';
describe('Injector-Unit', () => {
  it('Controller method should work', () => {
    class TestController {
      sayHello() {
        return 'hello';
      }
    }

    const module = new Module('TestModule', TestController);
    module.addController(TestController, new TestController());

    const wrapper = module.controllers.get(TestController);
    const instance = wrapper?.getInstance();

    expect(instance.sayHello()).to.deep.equal('hello');
  });
  it('Imported module should be added', () => {
    const rootModule = new Module('RootModule', class {});
    const importedModule = new Module('ImportedModule', class {});

    rootModule.addImports([importedModule]);
    const root = rootModule.imports;
    expect(root.has(importedModule)).to.be.equal(true);
  });
  it('Channel method should work', () => {
    class TestChannel {
      handle() {
        return 'channel working';
      }
    }

    const module = new Module('TestModule', TestChannel);
    module.addChannel(TestChannel, new TestChannel());

    const wrapper = module.channels.get(TestChannel);
    const instance = wrapper?.getInstance();
    expect(instance.handle()).to.deep.equal('channel working');
  });
  it('Should throw an Error', () => {
    class NoInstance {}

    const wrapper = new InstanceWrapper(NoInstance);
    expect(() => wrapper.getInstance()).to.throw('Instance class NoInstance{static{__name(this,"NoInstance")}} not initialized');
  });
  it('Combining Controller and Channel in one module', () => {
    class MyController {
      get() {
        return 'ok';
      }
    }
    class MyChannel {
      publish() {
        return 'sent';
      }
    }

    const apiModule = new Module('ApiModule', class ApiModule {});

    apiModule.addController(MyController, new MyController());
    apiModule.addChannel(MyChannel);
    expect(apiModule.controllers.size).to.deep.equal(1);
    expect(apiModule.channels.size).to.deep.equal(1);

    const chWrapper = apiModule.channels.get(MyChannel)!;
    expect(() => chWrapper.getInstance()).to.throw('Instance class MyChannel{static{__name(this,"MyChannel")}publish(){return"sent"}} not initialized');
  });
  it('Module A is added as an import to B', () => {
    const moduleA = new Module('A', class A {});
    const moduleB = new Module('B', class B {});

    moduleB.addImports([moduleA]);
    expect(moduleB.imports.has(moduleA)).to.be.true;
    expect(moduleA.imports.size).to.be.equal(0);
  });
  it('Adding a controller to the module', () => {
    class MyController {
      get() {
        return 'ok';
      }
    }

    const mod = new Module('AppModule', class AppModule {});
    expect(mod.controllers.size).to.be.equal(0);

    mod.addController(MyController);
    expect(mod.controllers.has(MyController)).to.be.true;

    const wrapper = mod.controllers.get(MyController)!;
    expect(() => wrapper.getInstance()).to.throw('Instance class MyController{static{__name(this,"MyController")}get(){return"ok"}} not initialized');
    mod.addController(MyController, new MyController());

    const wrapper2 = mod.controllers.get(MyController)!;
    expect(wrapper2.getInstance().get()).to.deep.equal('ok');
  });

  it('InstanceWrapper.id uses symbol.toString()', () => {
    const sym = Symbol('MySym');
    // @ts-ignore
    const wrapper = new InstanceWrapper(sym, class {});
    expect(wrapper.id).to.equal(sym.toString());
  });

  it('addController overrides existing wrapper instance', () => {
    class MyCtrl {}
    const mod = new Module('M', class {});
    mod.addController(MyCtrl);
    const original = mod.controllers.get(MyCtrl)!;
    // now override with a real instance
    const realInst = new MyCtrl();
    mod.addController(MyCtrl, realInst);
    const updated = mod.controllers.get(MyCtrl)!;

    expect(mod.controllers.size).to.equal(1);
    expect(updated).to.not.equal(original);
    expect(updated.getInstance()).to.equal(realInst);
  });

  it('addImports ignores duplicate modules', () => {
    const m1 = new Module('M1', class {});
    const m2 = new Module('M2', class {});
    // add the same import twice
    m1.addImports([m2, m2]);
    expect(m1.imports.size).to.equal(1);
    expect(m1.imports.has(m2)).to.be.true;
  });

  it('Controller and Channel maps remain separate even with same token', () => {
    class Shared {}
    const mod = new Module('M', class {});
    mod.addController(Shared, new Shared());
    mod.addChannel(Shared, new Shared());

    expect(mod.controllers.size).to.equal(1);
    expect(mod.channels.size).to.equal(1);

    const ctrlWrapper = mod.controllers.get(Shared)!;
    const chanWrapper = mod.channels.get(Shared)!;
    expect(ctrlWrapper).to.not.equal(chanWrapper);
    expect(ctrlWrapper.getInstance()).to.be.instanceOf(Shared);
    expect(chanWrapper.getInstance()).to.be.instanceOf(Shared);
  });
});
