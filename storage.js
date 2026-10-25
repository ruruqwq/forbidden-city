// ============================================================================
// 存储隔离 shim —— 脚手架生成，冻结文件，禁止修改（含 LZ_APP_ID 与任何逻辑）。
// 修改 = 旧存档丢失 / 同域多应用 key 冲突 / 隔离失效。确需调整：改 AGENTS.md
// 约定后由脚手架重新生成，不就地改。业务代码直接用 localStorage/sessionStorage
// （无需 import），不得绕过本 shim（如直取 window.localStorage.__gpRaw）。
// ============================================================================

// 行为：把 window.localStorage/sessionStorage 替换为带 LZ_APP_ID 前缀的代理，
// 业务代码无感知（方法/点形式均可）；物理 key 恒为 <LZ_APP_ID>:<key>；clear()
// 只清本命名空间，length/key(i) 只算本命名空间；原生 Storage 不可用（隐私模式等）
// 时退化为内存版（刷新即丢）。本脚本必须保持在所有 module script 之前执行。
(function () {
  var LZ_APP_ID = "gp-4232db85";
  var PREFIX = LZ_APP_ID + ":";
  function norm(k) {
    k = String(k);
    return k.indexOf(PREFIX) === 0 ? k.slice(PREFIX.length) : k;
  }
  function memoryStorage() {
    var m = {};
    var s = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function (k, v) { m[k] = String(v); },
      removeItem: function (k) { delete m[k]; },
      clear: function () { m = {}; },
      key: function (i) { return Object.keys(m)[i] || null; }
    };
    Object.defineProperty(s, "length", { get: function () { return Object.keys(m).length; } });
    return s;
  }
  function acquire(win, name) {
    try {
      var s = win[name];
      s.getItem("");
      if (s && s.__gpRaw) s = s.__gpRaw; // 已装过 shim（同窗口二次注入）→ 解包回原生，避免前缀嵌套
      return s;
    } catch { return memoryStorage(); }
  }
  function install(t) {
    function scopedKeys() {
      var out = [];
      for (var i = 0; i < t.length; i++) {
        var k = t.key(i);
        if (k != null && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
      }
      return out;
    }
    var fns = {
      getItem: function (k) {
        var key = String(k);
        return t.getItem(key === "visitor_fingerprint" ? key : PREFIX + norm(key));
      },
      setItem: function (k, v) {
        var key = String(k);
        t.setItem(key === "visitor_fingerprint" ? key : PREFIX + norm(key), v);
      },
      removeItem: function (k) { t.removeItem(PREFIX + norm(k)); },
      clear: function () { var ks = scopedKeys(); for (var j = 0; j < ks.length; j++) t.removeItem(PREFIX + ks[j]); },
      key: function (i) { var ks = scopedKeys(); return i >= 0 && i < ks.length ? ks[i] : null; }
    };
    return new Proxy(t, {
      get: function (tg, prop) {
        if (prop === "length") return scopedKeys().length;
        if (prop === "__gpRaw") return t;
        if (typeof prop === "string" && Object.prototype.hasOwnProperty.call(fns, prop)) return fns[prop];
        if (typeof prop === "string") {
          var v = tg.getItem(PREFIX + norm(prop));
          if (v !== null) return v;
        }
        return Reflect.get(tg, prop, tg);
      },
      set: function (tg, prop, v) {
        if (typeof prop === "string") { tg.setItem(PREFIX + norm(prop), v); return true; }
        return Reflect.set(tg, prop, v, tg);
      },
      deleteProperty: function (tg, prop) {
        if (typeof prop === "string") { tg.removeItem(PREFIX + norm(prop)); return true; }
        return Reflect.deleteProperty(tg, prop);
      },
      has: function (tg, prop) {
        if (typeof prop === "string" && tg.getItem(PREFIX + norm(prop)) !== null) return true;
        return Reflect.has(tg, prop);
      }
    });
  }
  try {
    Object.defineProperty(window, "localStorage", { value: install(acquire(window, "localStorage")), configurable: true });
    Object.defineProperty(window, "sessionStorage", { value: install(acquire(window, "sessionStorage")), configurable: true });
  } catch { /* 替换失败退回原生（无隔离），保应用可用 */ }
})();
