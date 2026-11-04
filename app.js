// AKIŞSAL — Supabase bağlantı bilgileri
const SUPABASE_URL = "https://vxegezxuyhupcdmpilpb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Nv1Q4fEPTZK0PfqJ5uMJIg_sK7G83Py";
const configured = SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.startsWith("sb_publishable_");
const $ = id => document.getElementById(id);function authMessage(msg){$("authMsg").textContent=msg}
function showTab(tab){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));$("loginForm").classList.toggle("hidden",tab!=="login");$("signupForm").classList.toggle("hidden",tab!=="signup");authMessage("")}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
function showApp(on){$("authView").classList.toggle("hidden",on);$("appView").classList.toggle("hidden",!on);$("logoutBtn").classList.toggle("hidden",!on)}
async function uploadAvatar(file,userId){if(!file)return null;if(file.size>3*1024*1024)throw Error("Fotoğraf en fazla 3 MB olabilir.");const ext=(file.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,"");const path=`${userId}/${Date.now()}.${ext}`;const {error}=await db.storage.from("avatars").upload(path,file,{upsert:true,contentType:file.type});if(error)throw error;return db.storage.from("avatars").getPublicUrl(path).data.publicUrl}
async function loadData(){
 const [{data:p,error:pe},{data:e,error:ee}]=await Promise.all([db.from("profiles").select("*").order("display_name"),db.from("score_events").select("*").order("created_at",{ascending:false}).limit(100)]);
 if(pe)throw pe;if(ee)throw ee;profiles=p||[];events=e||[];myProfile=profiles.find(x=>x.id===currentUser.id);if(!myProfile)throw Error("Profil kaydı bulunamadı.");
 render();
}
const sums=id=>events.filter(e=>e.user_id===id).reduce((a,e)=>{a[e.counter_type]+=e.delta;return a},{flow:0,shame:0});
function render(){
 $("welcomeName").textContent=myProfile.display_name;$("myAvatar").outerHTML=avatarHTML(myProfile,"my-avatar");$("memberCount").textContent=`${profiles.length} ÜYE`;
 const total=profiles.reduce((a,p)=>{const s=sums(p.id);a.flow+=s.flow;a.shame+=s.shame;return a},{flow:0,shame:0});
 $("totalFlow").textContent=total.flow;$("totalShame").textContent=total.shame;
 const sorted=[...profiles].sort((a,b)=>{const x=sums(a.id),y=sums(b.id);return (y.flow-y.shame)-(x.flow-x.shame)});
 $("leaderboard").innerHTML=sorted.map((p,i)=>{const s=sums(p.id);return `<div class="leader-row"><span class="rank">${String(i+1).padStart(2,"0")}</span>${avatarHTML(p)}<div><div class="leader-name">${esc(p.display_name)}</div><div class="leader-sub">Akış ${s.flow} · Ayıp ${s.shame}</div></div><div class="leader-score">${s.flow-s.shame}<small>NET PUAN</small></div></div>`}).join("")||'<p class="muted">Henüz üye yok.</p>';
 $("myProfileCard").innerHTML=`${avatarHTML(myProfile)}<div><strong>${esc(myProfile.display_name)}</strong><span class="muted">AKIŞSAL üyesi</span></div><div class="profile-values"><div>${sums(myProfile.id).flow}<small>AKIŞ</small></div><div style="color:var(--red)">${sums(myProfile.id).shame}<small>AYIP</small></div></div>`;
 const isAdmin=myProfile.role==="admin";$("adminPanel").classList.toggle("hidden",!isAdmin);
 if(isAdmin){$("targetUser").innerHTML=profiles.map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join("");$("activity").innerHTML=events.slice(0,12).map(e=>{const p=profiles.find(x=>x.id===e.user_id);return `<div class="activity-item"><div><b>${esc(p?.display_name||"Üye silinmiş")}</b><small>${e.counter_type==="flow"?"Akışmetre":"Ayıpmetre"} · ${esc(e.note||"Not yok")} · ${new Date(e.created_at).toLocaleString("tr-TR")}</small></div><span class="${e.delta>0?"positive":"negative"}">${e.delta>0?"+":""}${e.delta}</span></div>`}).join("")||'<p class="muted">Henüz hareket yok.</p>'}
}
async function refresh(){await loadData()}
$("loginForm").addEventListener("submit",async ev=>{ev.preventDefault();authMessage("Giriş yapılıyor…");const {error}=await db.auth.signInWithPassword({email:$("loginEmail").value,password:$("loginPassword").value});if(error){authMessage(error.message);return}authMessage("")});
$("signupForm").addEventListener("submit",async ev=>{ev.preventDefault();authMessage("Davet kodu kontrol ediliyor…");try{
 const code=$("inviteCode").value.trim().toUpperCase();const {data:invite,error:ie}=await db.from("invite_codes").select("*").eq("code",code).eq("active",true).maybeSingle();if(ie)throw ie;if(!invite)throw Error("Davet kodu geçersiz veya kullanılmış.");
 const {data,error}=await db.auth.signUp({email:$("signupEmail").value,password:$("signupPassword").value,options:{data:{display_name:$("signupName").value.trim()}}});if(error)throw error;if(!data.user)throw Error("Hesap oluşturulamadı.");
 // Profil trigger tarafından oluşturulur. E-posta doğrulaması açıksa giriş için önce e-postanı doğrula.
 let avatar=null;try{avatar=await uploadAvatar($("avatarFile").files[0],data.user.id)}catch(err){console.warn(err)}
 if(avatar)await db.from("profiles").update({avatar_url:avatar}).eq("id",data.user.id);
 const {data:redeemed,error:re}=await db.rpc("redeem_invite",{p_code:code,p_user:data.user.id});if(re)throw re;if(!redeemed)throw Error("Davet kodu bu sırada kullanılmış.");
 authMessage(data.session?"Hesabın hazır!":"Hesabın oluşturuldu. E-postanı doğrula, ardından giriş yap.");
 if(data.session)showTab("login");
 }catch(err){authMessage(err.message||"Bir hata oluştu.")}});
$("logoutBtn").addEventListener("click",()=>db.auth.signOut());
async function changeScore(delta){try{const userId=$("targetUser").value,type=$("counterType").value,n=Math.max(1,Math.min(999,Math.floor(Number($("scoreAmount").value)||1)));const {error}=await db.from("score_events").insert({user_id:userId,counter_type:type,delta:delta*n,note:$("scoreNote").value.trim()||null,created_by:currentUser.id});if(error)throw error;$("scoreNote").value="";await refresh();toast("Puan hareketi kaydedildi.");}catch(e){toast(e.message||"İşlem başarısız.")}}
$("addScore").addEventListener("click",()=>changeScore(1));$("removeScore").addEventListener("click",()=>changeScore(-1));
$("makeInvite").addEventListener("click",async()=>{try{const code="AKS-"+crypto.randomUUID().slice(0,8).toUpperCase();const {error}=await db.from("invite_codes").insert({code,created_by:currentUser.id,active:true});if(error)throw error;const link=`${location.origin}${location.pathname}?invite=${code}`;$("inviteResult").classList.remove("hidden");$("inviteResult").innerHTML=`<b>${code}</b><br><span>${esc(link)}</span><br><button class="secondary" id="copyInvite" style="margin-top:10px">Bağlantıyı kopyala</button>`;$("copyInvite").onclick=async()=>{await navigator.clipboard.writeText(link);toast("Davet bağlantısı kopyalandı.")};}catch(e){toast(e.message||"Davet oluşturulamadı.")}});
async function start(){
 if(!configured){$("setupNotice").classList.remove("hidden");showApp(false);return}
 db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
 const {data:{session}}=await db.auth.getSession();
 db.auth.onAuthStateChange(async(_event,session)=>{if(session){currentUser=session.user;try{await loadData();showApp(true)}catch(e){showApp(false);toast(e.message)}}else{currentUser=null;showApp(false)}});
 if(session){currentUser=session.user;try{await loadData();showApp(true)}catch(e){showApp(false);toast(e.message)}}else showApp(false);
}
start();
