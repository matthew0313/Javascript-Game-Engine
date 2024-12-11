//engine
let canvas = document.getElementById("Screen");
let ctx = canvas.getContext("2d");

//Component design
class GameObject{
    constructor(name){
        this.name = name;
        this.active = true;
        this.components = [];
        this.transform = new Transform();
        this.AddComponent(this.transform);
        GameObject.gameObjects.push(this);
    }
    static gameObjects = [];
    EarlyUpdate(){
        for(let i = 0 ; i < this.components.length ; i++){
            if(this.components[i].enabled) this.components[i].EarlyUpdate();
        }
    }
    Update(){
        for(let i = 0 ; i < this.components.length ; i++){
            if(this.components[i].enabled) this.components[i].Update();
        }
    }
    LateUpdate(){
        for(let i = 0 ; i < this.components.length ; i++){
            if(this.components[i].enabled) this.components[i].LateUpdate();
        }
    }
    AddComponent(component){
        component.gameObject = this;
        component.transform = this.transform;
        this.components.push(component);
        return component;
    }
    FindComponent(name){
        for(let i = 0 ; i < this.components.length ; i++){
            if(this.components[i].name == name) return this.components[i];
        }
        return null;
    }
    Destroy(){
        GameObject.gameObjects.splice(GameObject.gameObjects.indexOf(this), 1);
    }
}
class Component{
    constructor(name){
        this.name = name;
        this.enabled = true;
    }
    EarlyUpdate(){

    }
    Update(){
            
    }
    LateUpdate(){

    }
}

//Basic Components
class Transform extends Component{
    constructor(){
        super("Transform");
        this.position = Vector2.Zero();
    }
    Translate(translation){
        this.position = Vector2.Add(this.position, translation);
    }
}
class ImageRenderer extends Component{
    constructor(width, height, image){
        super("ImageRenderer");
        this.width = width;
        this.height = height;
        this.image = image;
        this.rendering = true;
    }
    LateUpdate(){
        super.LateUpdate();
        if(this.image == null) return;
        if(!this.image.loaded || !this.rendering) return;
        ctx.save();
        ctx.drawImage(this.image.image, this.transform.position.x - this.width / 2.0, this.transform.position.y - this.height / 2.0, this.width, this.height);
        ctx.restore();
    }
}
class SquareRenderer extends Component{
    constructor(width, height, color){
        super("SquareRenderer");
        this.width = width;
        this.height = height;
        this.color = color;
        this.rendering = true;
    }
    LateUpdate(){
        super.LateUpdate();
        if(!this.rendering) return;
        ctx.save();
        ctx.fillStyle = this.color.CreateString();
        ctx.fillRect(this.transform.position.x - this.width / 2.0, this.transform.position.y - this.height / 2.0, this.width, this.height)
        ctx.restore();
    }
}
class TrailRenderer extends Component{
    constructor(radius, gradient, duration, startAlpha, endAlpha){
        super("TrailRenderer");
        this.radius = radius;
        this.gradient = gradient;
        this.duration = duration;
        this.startAlpha = startAlpha;
        this.endAlpha = endAlpha;
        this.trails = [];
        this.rendering = true;
        this.drawing = true;
    }
    LateUpdate(){
        super.LateUpdate();
        if(!this.rendering) return;
        if(this.drawing){
            this.trails.push({
                x: this.transform.position.x,
                y: this.transform.position.y,
                color: this.color,
                time: 0
            });
        }
        for(let i = this.trails.length - 1 ; i >= 0 ; i--){
            let unit = this.trails[i];
            ctx.save();
            ctx.beginPath();
            let color = this.gradient.GetColorAt(unit.time / this.duration);
            ctx.fillStyle = color.CreateStringAlpha(Mathf.Lerp(this.startAlpha, this.endAlpha, unit.time / this.duration));
            ctx.arc(unit.x, unit.y, this.radius * (1.0 - unit.time / this.duration), 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            this.trails[i].time += Time.deltaTime;
            if(this.trails[i].time > this.duration){
                this.trails.splice(i, 1);
            }
        }
    }
}
class TextRenderer extends Component{
    constructor(text, font, color, textAlign, isStroke, heightOffset, maxWidth){
        super("TextRenderer");
        this.text = text;
        this.font = font;
        this.color = color;
        this.textAlign = textAlign;
        this.isStroke = isStroke;
        this.heightOffset = heightOffset;
        this.maxWidth = maxWidth;
    }
    LateUpdate(){
        super.LateUpdate();
        ctx.save();
        ctx.font = this.font;
        ctx.fillStyle = this.color.CreateString();
        ctx.textAlign = this.textAlign;
        if(!this.isStroke){
            if(this.maxWidth == null) ctx.fillText(this.text, this.transform.position.x, this.transform.position.y + this.heightOffset);
            else ctx.fillText(this.text, this.transform.position.x, this.transform.position.y + this.heightOffset, this.maxWidth);
        }
        else{
            if(this.maxWidth == null) ctx.strokeText(this.text, this.transform.position.x, this.transform.position.y + this.heightOffset);
            else ctx.strokeText(this.text, this.transform.position.x, this.transform.position.y + this.heightOffset, this.maxWidth);
        }
        ctx.restore();
    }
}
class BoxCollider extends Component{
    constructor(width, height){
        super("BoxCollider");
        this.width = width;
        this.height = height;
        BoxCollider.boxColliders.push(this);

        this.onCollisionEnter = null;
        this.onCollisionExit = null;
        this.touching = [];
    }
    static boxColliders = [];
    static X = [-1, -1, 1, 1];
    static Y = [-1, 1, -1, 1];
    Update(){
        super.Update();
        for(let i = 0 ; i < BoxCollider.boxColliders.length ; i++){
            if(BoxCollider.boxColliders[i] == this) continue;
            let other = BoxCollider.boxColliders[i];
            let xStart, xEnd, yStart, yEnd;
            let distX, distY;
            let self, target;

            let touching = false;

            self = this;
            target = other;

            xStart = self.transform.position.x - self.width / 2.0; xEnd = self.transform.position.x + self.width / 2.0;
            yStart = self.transform.position.y - self.height / 2.0; yEnd = self.transform.position.y + self.height / 2.0;
            distX = target.width / 2.0; distY = target.width / 2.0;
            for(let k = 0 ; k < 4 ; k++){
                let posX = target.transform.position.x + distX * BoxCollider.X[k];
                let posY = target.transform.position.y + distY * BoxCollider.Y[k];
                if(posX >= xStart && posX <= xEnd && posY >= yStart && posY <= yEnd){
                    touching = true;
                    break;
                }
            }

            self = other;
            target = this;

            xStart = self.transform.position.x - self.width / 2.0; xEnd = self.transform.position.x + self.width / 2.0;
            yStart = self.transform.position.y - self.height / 2.0; yEnd = self.transform.position.y + self.height / 2.0;
            distX = target.width / 2.0; distY = target.width / 2.0;
            for(let k = 0 ; k < 4 ; k++){
                let posX = target.transform.position.x + distX * BoxCollider.X[k];
                let posY = target.transform.position.y + distY * BoxCollider.Y[k];
                if(posX >= xStart && posX <= xEnd && posY >= yStart && posY <= yEnd){
                    touching = true;
                    break;
                }
            }

            if(touching){
                if(this.touching.find((tmp) => tmp == other) == undefined){
                    if(this.onCollisionEnter != null) this.onCollisionEnter(other);
                    if(other.onCollisionEnter != null) other.onCollisionEnter(this);
                    this.touching.push(other);
                    other.touching.push(this);
                }
            }
            else{
                if(this.touching.find((tmp) => tmp == other) != undefined){
                    if(this.onCollisionExit != null) this.onCollisionExit(other);
                    if(other.onCollisionExit != null) other.onCollisionExit(this);
                    this.touching.splice(this.touching.indexOf(other), 1);
                    other.touching.splice(other.touching.indexOf(this), 1);
                }
            }
        }
    }
}
class Button extends Component{
    constructor(width, height){
        super("Button");
        this.width = width;
        this.height = height;
        this.hovered = false;
        this.clicked = false;

        this.onClick = null;
    }
    Update(){
        let startX = this.transform.position.x - this.width / 2;
        let endX = this.transform.position.x + this.width / 2;
        let startY = this.transform.position.y - this.height / 2;
        let endY = this.transform.position.y + this.height / 2;
        if(Input.GetMousePos().x >= startX && Input.GetMousePos().x <= endX && Input.GetMousePos().y >= startY && Input.GetMousePos().y <= endY){
            this.hovered = true;
            if(Input.GetMouseButtonDown()){
                if(!this.clicked && this.onClick != null) this.onClick();
                this.clicked = true;
            }
            else if(!Input.GetMouseButton()){
                this.clicked = false;
            }
        }
        else{
            this.hovered = false;
            this.clicked = false;
        }
    }
}
//static classes
class Time{
    static deltaTime = 0;
}
class Input{
    static keys = [];
    static FindKey(keyName){
        for(let i = 0 ; i < Input.keys.length ; i++){
            if(Input.keys[i].key == keyName) return Input.keys[i];
        }
        return null;
    }
    static GetKeyDown(keyName){
        let key = Input.FindKey(keyName);
        if(key == null) return false;
        else{
            return key.state == 1;
        }
    }
    static GetKey(keyName){
        let key = Input.FindKey(keyName);
        if(key == null) return false;
        else{
            return key.state == 1 || key.state == 2;
        }
    }
    static GetKeyUp(keyName){
        let key = Input.FindKey(keyName);
        if(key == null) return false;
        else{
            return key.state == 3;
        }
    }
    static AddKey(...args){
        for(let arg of args){
            let exist = false;
            for(let i of Input.keys){
                if(i.key == arg){
                    exist = true;
                    break;
                }
            }
            if(!exist) Input.keys.push({key: arg, pressed: false, state: 0});
        }
    }
    static axis = [];
    static GetAxis(axisName){
        for(let i of Input.axis){
            if(i.name == axisName) return i.value;
        }
        return 0;
    }
    static AddAxis(axis){
        Input.axis.push(axis);
    }
    static mouseX = 0;
    static mouseY = 0;
    static mousePressed = false;
    static mousePressedMode = 0;
    static GetMouseButtonDown(){
        return Input.mousePressedMode == 1;
    }
    static GetMouseButton(){
        return Input.mousePressedMode == 1 || Input.mousePressedMode == 2;
    }
    static GetMouseButtonUp(){
        return Input.mousePressedMode == 3;
    }
    static GetMousePos(){
        return new Vector2(Input.mouseX, Input.mouseY);
    }
    static Init(){
        document.addEventListener("keydown", (event) => {
            let key = Input.FindKey(event.key);
            if(key == null) return;
            else key.pressed = true;
        });
        document.addEventListener("keyup", (event) => {
            let key = Input.FindKey(event.key);
            if(key == null) return;
            else key.pressed = false;
        });
        canvas.addEventListener("mousemove", (event) => {
            let rect = canvas.getBoundingClientRect();
            Input.mouseX = event.clientX - rect.left;
            Input.mouseY = event.clientY - rect.top;
        }, false);
        canvas.addEventListener("mousedown", (event) => {
            Input.mousePressed = true;
        });
        canvas.addEventListener("mouseup", (event) => {
            Input.mousePressed = false;
        });
    }
    static Update(){
        for(let i = 0 ; i < Input.keys.length ; i++){
            if(Input.keys[i].pressed == true){
                if(Input.keys[i].state == 0 || Input.keys[i].state == 3) Input.keys[i].state = 1;
                else Input.keys[i].state = 2;
            }
            else{
                if(Input.keys[i].state == 1 || Input.keys[i].state == 2) Input.keys[i].state = 3;
                else Input.keys[i].state = 0;
            }
        }
        if(Input.mousePressed){
            if(Input.mousePressedMode == 0 || Input.mousePressedMode == 3) Input.mousePressedMode = 1;
            else Input.mousePressedMode = 2;
        }
        else{
            if(Input.mousePressedMode == 1 || Input.mousePressedMode == 2) Input.mousePressedMode = 3;
            else Input.mousePressedMode = 0;
        }
        for(let i of Input.axis) i.Update();
    }
}
class Mathf{
    static Clamp(min, max, value){
        if(value < min) return min;
        if(value > max) return max;
        else return value;
    }
    static Lerp(start, end, interpolation){
        return start + (end - start) * interpolation;
    }
    static Max(a, b){
        return (a > b) ? a : b;
    }
    static Min(a, b){
        return (a > b) ? b : a;
    }
}
//datatypes
class Color{
    constructor(r, g, b){
        this.r = r;
        this.g = g;
        this.b = b;
    }
    static HSVtoRGB(h, s, v) {
        var r, g, b, i, f, p, q, t;
        if (arguments.length === 1) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return new Color(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
    }
    CreateString(){
        return "rgb(" + this.r + "," + this.g + "," + this.b + ")";
    }
    CreateStringAlpha(alpha){
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + alpha + ")";
    }
}
class Gradient{
    constructor(startColor, endColor){
        this.points = [];
        this.AddColorPoint(0.0, startColor);
        this.AddColorPoint(1.0, endColor);
    }
    AddColorPoint(point, color){
        this.points.push({
            point: point,
            color: color
        });
        this.points.sort((a, b) => a.point - b.point);
        return this;
    }
    GetColorAt(point){
        point = Mathf.Clamp(0, 1, point);
        let i;
        for(i = 1 ; i < this.points.length ; i++){
            if(point < this.points[i].point) break;
        }
        if(i == this.points.length) return this.points[this.points.length - 1].color;
        let start = this.points[i-1];
        let end = this.points[i];
        let length = end.point - start.point;
        let progress = point - start.point;
        let interpolation = progress / length;
        return new Color(
            Mathf.Lerp(start.color.r, end.color.r, interpolation),
            Mathf.Lerp(start.color.g, end.color.g, interpolation),
            Mathf.Lerp(start.color.b, end.color.b, interpolation)
        )
    }
}
class Vector2{
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    static Right(){
        return new Vector2(1, 0);
    }
    static Left(){
        return new Vector2(-1, 0);
    }
    static Up(){
        return new Vector2(0, 1);
    }
    static Down(){
        return new Vector2(0, -1);
    }
    static Zero(){
        return new Vector2(0, 0);
    }
    static Add(a, b){
        return new Vector2(a.x + b.x, a.y + b.y);
    }
    static Subtract(a, b){
        return new Vector2(a.x - b.x, a.y - b.y);
    }
    static Multiply(a, b){
        if(typeof(a) == "number") return new Vector2(b.x * a, b.y * a);
        else if(typeof(b) == "number") return new Vector2(a.x * b, a.y * b);
        else return new Vector2(a.x * b.x, a.y * b.y);
    }
}
class Axis{
    constructor(name, negativeKeys, positiveKeys, accelerationRate, decelerationRate){
        this.name = name;
        this.value = 0;
        this.negativeKeys = negativeKeys;
        this.positiveKeys = positiveKeys;
        this.accelerationRate = accelerationRate;
        this.decelerationRate = decelerationRate;
        for(let i of negativeKeys) Input.AddKey(i);
        for(let i of positiveKeys) Input.AddKey(i);
    }
    Update(){
        let negativeKeyPressed = false;
        for(let i of this.negativeKeys){
            if(Input.GetKey(i)){
                negativeKeyPressed = true;
                break;
            }
        }
        let positiveKeyPressed = false;
        for(let i of this.positiveKeys){
            if(Input.GetKey(i)){
                positiveKeyPressed = true;
                break;
            }
        }
        if(negativeKeyPressed && positiveKeyPressed || !negativeKeyPressed && !positiveKeyPressed){
            if(this.value > 0){
                this.value = Mathf.Max(0, this.value - this.decelerationRate * Time.deltaTime);
            }
            else if(this.value < 0){
                this.value = Mathf.Min(0, this.value + this.decelerationRate * Time.deltaTime);
            }
        }
        else{
            if(positiveKeyPressed){
                this.value = Mathf.Min(1, this.value + this.accelerationRate * Time.deltaTime);
            }
            else if(negativeKeyPressed){
                this.value = Mathf.Max(-1, this.value - this.accelerationRate * Time.deltaTime);
            }
        }
    }
}
class RenderedImage{
    constructor(src){
        this.image = new Image;
        this.image.src = src;
        this.loaded = false;
        this.image.onload = () => {
            this.loaded = true;
        }
    }
}

//Initialization
function Start(){
    Input.Init();
    Input.AddKey("W", "w", "A", "a", "S", "s", "D", "d");
    Input.AddAxis(new Axis("Horizontal", ["A", "a", "ArrowLeft"], ["D", "d", "ArrowRight"], 10, 5));
    Input.AddAxis(new Axis("Vertical", ["W", "w", "ArrowUp"], ["S", "s", "ArrowDown"], 10, 5));
    requestAnimationFrame(Update);
}
let prevTime = Date.now();
function Update(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Time.deltaTime = (Date.now() - prevTime) / 1000;
    prevTime = Date.now();
    Input.Update();
    for(let i = 0 ; i < GameObject.gameObjects.length ; i++){
        if(GameObject.gameObjects[i].active) GameObject.gameObjects[i].EarlyUpdate();
    }
    for(let i = 0 ; i < GameObject.gameObjects.length ; i++){
        if(GameObject.gameObjects[i].active) GameObject.gameObjects[i].Update();
    }
    for(let i = 0 ; i < GameObject.gameObjects.length ; i++){
        if(GameObject.gameObjects[i].active) GameObject.gameObjects[i].LateUpdate();
    }
    requestAnimationFrame(Update);
}
Start();