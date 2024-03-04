import { Abstract } from "./abstract";

export class App {
  private readonly source: Abstract.App;
  private readonly scope = new Scope();

  constructor(source: Abstract.App) {
    this.source = source;

    for (const member of this.source.members) {
      if (member.kind === "val") {
        this.scope.addMember(member.key, new Val(member, this.scope));
      } else if (member.kind === "fun") {
        this.scope.addMember(member.key, new Fun(member, this.scope));
      } else {
        throw new Error(`App has a member of unknown kind: ${(member as Abstract.Node).kind}.`);
      }
    }

    const main = this.scope.getMember("main");

    if (!(main instanceof Fun)) {
      throw new Error("App has no expected member fun main.");
    }

    main.handleEvent();
  }
}

class Scope {
  private readonly id = crypto.randomUUID();
  private readonly members: Record<string, Val | Fun | Function> = {};

  addMember(key: string, member: Val | Fun | Function): void {
    this.members[key] = member;
  }

  getMember(key: string): Val | Fun | Function | undefined {
    return this.members[key];
  }
}

class Val {
  private readonly source: Abstract.Val;
  private readonly scope: Scope;
  private readonly binding: Raw | Ref | Call | Component;

  constructor(source: Abstract.Val, scope: Scope) {
    this.source = source;
    this.scope = scope;

    if (this.source.binding.kind === "raw") {
      this.binding = new Raw(this.source.binding, this.scope);
    } else if (this.source.binding.kind === "ref") {
      this.binding = new Ref(this.source.binding, this.scope);
    } else if (this.source.binding.kind === "call") {
      this.binding = new Call(this.source.binding, this.scope);
    } else if (this.source.binding.kind === "component") {
      this.binding = new Component(this.source.binding, this.scope);
    } else {
      throw new Error(
        `Val ${this.source.key} has a binding of unknown kind: ${(this.source.binding as Abstract.Node).kind}.`,
      );
    }
  }

  getMember(key: string): Val | Function | undefined {
    return this.binding.getMember(key);
  }

  getValue(): unknown {
    return this.binding.getValue();
  }
}

class Fun {
  private readonly source: Abstract.Fun;
  private readonly scope: Scope;
  private readonly binding: Routine;

  constructor(source: Abstract.Fun, scope: Scope) {
    this.source = source;
    this.scope = scope;

    this.binding = new Routine(this.source.binding, this.scope);
  }

  async handleEvent(...args: Array<Raw | Ref | Call | Component | Routine>): Promise<unknown> {
    return this.binding.handleEvent(...args);
  }
}

class Raw {
  private readonly source: Abstract.Raw;
  private readonly scope: Scope;

  constructor(source: Abstract.Raw, scope: Scope) {
    this.source = source;
    this.scope = scope;
  }

  getMember(key: string): Val | Function | undefined {
    const memberValue = this.source.value[key];

    if (typeof memberValue === "function") {
      const callableMemberValue =
        memberValue.prototype?.constructor === memberValue
          ? (...args: Array<unknown>) => new memberValue(...args)
          : memberValue.bind(this.source.value);

      const memberFunction = (...args: Array<Raw | Ref | Call | Component | Routine>) => {
        const argValues = args.map((arg) => arg.getValue());
        const result = callableMemberValue(...argValues);
        return result;
      };

      return memberFunction;
    }

    if (memberValue !== undefined) {
      const memberVal = new Val(
        {
          kind: "val",
          key,
          binding: {
            kind: "raw",
            value: memberValue,
          },
        },
        this.scope,
      );

      return memberVal;
    }

    return undefined;
  }

  getValue(): unknown {
    return this.source.value;
  }
}

class Ref {
  private readonly source: Abstract.Ref;
  private readonly scope: Scope;
  private readonly pointer?: Val; // | Var

  constructor(source: Abstract.Ref, scope: Scope) {
    this.source = source;
    this.scope = scope;

    let sourceScope: Scope | Raw | Ref | Call = this.scope;

    if (this.source.scope?.kind === "raw") {
      sourceScope = new Raw(this.source.scope, this.scope);
    } else if (this.source.scope?.kind === "ref") {
      sourceScope = new Ref(this.source.scope, this.scope);
    } else if (this.source.scope?.kind === "call") {
      sourceScope = new Call(this.source.scope, this.scope);
    } else if (this.source.scope !== undefined) {
      throw new Error(
        `Ref ${this.source.foreignKey} has a scope of unknown kind: ${(this.source.scope as Abstract.Node).kind}.`,
      );
    }

    const sourceScopeMember = sourceScope.getMember(this.source.foreignKey);

    if (sourceScopeMember instanceof Val) {
      this.pointer = sourceScopeMember;
    } else if (sourceScopeMember === undefined) {
      const windowRaw = new Raw({ kind: "raw", value: window }, this.scope);
      const windowMember = windowRaw.getMember(this.source.foreignKey);

      if (windowMember instanceof Val) {
        this.pointer = windowMember;
      }
    }
  }

  getMember(key: string): Val | Function | undefined {
    return this.pointer?.getMember(key);
  }

  getValue(): unknown {
    return this.pointer?.getValue();
  }
}

class Call {
  private readonly source: Abstract.Call;
  private readonly scope: Scope;
  private readonly pointer?: Fun | Function;
  private readonly args: Array<Raw | Ref | Call | Component | Routine>;

  constructor(source: Abstract.Call, scope: Scope) {
    this.source = source;
    this.scope = scope;

    let sourceScope: Scope | Raw | Ref | Call = this.scope;

    if (this.source.scope?.kind === "raw") {
      sourceScope = new Raw(this.source.scope, this.scope);
    } else if (this.source.scope?.kind === "ref") {
      sourceScope = new Ref(this.source.scope, this.scope);
    } else if (this.source.scope?.kind === "call") {
      sourceScope = new Call(this.source.scope, this.scope);
    } else if (this.source.scope !== undefined) {
      throw new Error(
        `Call ${this.source.foreignKey} has a scope of unknown kind: ${(this.source.scope as Abstract.Node).kind}.`,
      );
    }

    this.pointer =
      sourceScope.getMember(this.source.foreignKey) ??
      new Raw({ kind: "raw", value: window }, this.scope).getMember(this.source.foreignKey);
  }

  getMember(key: string): Val | Function | undefined {
    return this.pointer?.getMember(key);
  }

  getValue(): unknown {
    return this.pointer?.getValue();
  }

  async handleEvent(): Promise<unknown> {
    return this.pointer?.handleEvent(...this.args);
  }
}
