NOTES

# Lesson 02 - Starting Small #

**Tap Target  Sizes** 

To make it usable, and avoid mis-clicking make sure there is a gap of 48px between every tappable element.

 
```
nav a, button { 
  min-width:48px; 
  min-height:48px; 
} 
``` 

**Start Small**

Start designing from the smallest phone and then grow from there. Phone-> Tablet-> PC 

With this the design will prioritize element.  

Also, the performance gets impacted, because you will prioritizing about the information needed by the user and how much data is needed. 

# Lesson 03 - Building Up #
 
**Basic Media Query**

To use a specific css for a resolution:

```
<link rel="stylesheet" media="screen and (min-width:500px)" href="over500.css">
```

It also can be embedded at the css, it has the benefit that it will be few http request but it will be using  bigger files.

min-width  is based on the size of the window and min-device-width is the size of the screen

Example

```
  @media screen and (max-width: 400px) {
    body {
      background: red;
    }
  }

  @media screen and (min-width: 401px) and (max-width: 599px) {
    body {
      background: green;
    }
  }

  @media screen and (min-width:600px) {
    body {
      background: blue;
    }
  }
```

Find breakpoints based on the content and not the possible device resolutions.

**Grids**

Want to learn more about grids? Check out[ MDN's introduction to grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout/Basic_Concepts_of_Grid_Layout).

**Flex**

display:flex
order:1


# Lesson 04 - Common Responsive Patterns #

**Column Drop**

As its narrowest viewport, each element simply stacks vertically,one on top of the other.  As the screen gets wider, the elements expand, until the first breakpoint is hit, and the elements start to get side by side instead of stacked.

```
<div class="container">
  <div class="box dark_blue">
  <div class="box light_blue">
  <div class="box green">
</div>

<style type="text/css">

.container{
  display:flex;
  flex-wrap:wrap;
}

.box{
  100%
}

/* At 450px dark and blue box will be next to each other */
@media screen and (min-width: 450px) {
  .dark_blue {
    width: 25%;
  }
  .light_blue {
    width: 75%;
  }
}

/* At 550px all boxes will be next to each other */
@media screen and (min-width: 550px) {
  .dark_blue, .green {
    width: 25%;
  }
  .light_blue {
    width: 50%;
  }
}

</style>
```

**Mostly Fluid**

It is like the column drop, but it tends to be a bit more grid like, with more columns and columns fitting in a different way depending on the viewport width.

```
<div class="container">
  <div class="box dark_blue">
  <div class="box light_blue">
  <div class="box green">
  <div class="box red">
  <div class="box orange">
</div>

<style type="text/css">

.container{
  display:flex;
  flex-wrap:wrap;
}

.box{
  100%
}

/* At 450px  light blue and green  box will be next to each other */

@media screen and (min-width: 450px) {
  .light_blue, .green {
    width: 50%;
  }
}

/* At 550px all the boxes change order and width percentages */
@media screen and (min-width: 550px) {
  .dark_blue, .light_blue {
    width: 50%;
  }
  .green, .red, .orange {
    width: 50%;
  }
}

/* At 700px it adds margin to the side
 */
@media screen and (min-width: 550px) {
  .container{
    width:700px;
    margin-left:auto;
    margin-right:auto;
  }
}

</style>
```


**Layout Shifter**

Is the most responsive pattern, with multiple break points accross several different screen widths, but the key of this layout is the way that content moves about instead of  reflowing and dropping below other columns.

```
<div class="container">
  <div class="box dark_blue">
  <div class="container" id="container2">
    <div class="box light_blue">
    <div class="box green">
  </div>
  <div class="box red">
</div>


.container{
  width:100%;
  display:flex;
  flex-wrap:wrap;

}

.box{
  100%
}

/* At this 500px breakpoint, the dark blue will be one column and the container another one (with light blue and green) */

@media screen and (min-width: 500px) {

  .dark_blue {
    width: 50%;
  }

  #container2 {
    width:50%;
  }

}

/* At this 500px breakpoint, the container (with light blue and green)  is between the red and blue boxe. Note that the order of the red box swithched and now is the first item at the left. */

@media screen and (min-width: 600px) {

  .dark_blue {
    width: 25%;
    order:1;
  }

  #container2 {
    width:50%;
  }
  .red {
    width:25%;
    order:-1;
  }

}
```

**Off  Canvas**

With off canvas, instead of stacking content vertically,  the off canvas pattern placess less frequently used content; for example navigation or app menus off screen, only showing when the app is big enough.

```
<nav id="drwawer" class="dark_blue">
</nav>

<main class="light_blue">
</main>

html, body, main {
  height: 100%;
  width:100%;
}

nav {
  width: 300px;
  height: 100%;
  position: absolute;
  transform: translate(-300px, 0);
  transition: transform 0.3s ease;
}
/* When open it removes the transforms */ 
nav.open{
  transform: translate(0,0);
}


@media screen and (min-width: 600px) {

  // reset the transform
  nav{
    position: relative;
    transform: translate(0,0);
  }

  body {
    display: flex;
    flex-flow: row nowrap;
  }
  // Flex grows and allows the content to take up the full 
  // remaining width of the viewport
  main {
    width: auto;
    flex-grow:1;
  }


}
```

# Lesson 05 - Optimizations #

*Images*

Use different image sizes depending on the device

*Responsive Tables*

Techniques:
- Hidden Columns - hides columns based on importance as the view port gets smaller

```
@media screen and (max-width:499px){
  .gametime{
    display:none;
  }
}
```

- No More Tables - At certain viewport, the table colapses and resembles a long list.
- Contained Tables - by adding a { width:100%; overflow-x:auto; } the table will include a scrollbar

*Fonts*

Ideal measure: 45-90 characters per line.
Use measures as a factor for picking breakpoints.
Fonts should big enough to read  on any device. 16px is a good starting point

*Minor Breakpoints*
It is helpful to have minor breakpoints between major to make small changes like padding, margin, or increase font size