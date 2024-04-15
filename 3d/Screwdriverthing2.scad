include <Round-Anything/MinkowskiRound.scad>

outerPathRadius=10.5;
innerPathRadius=9.32;
midCylinderHeight = 15.31;
numberOfSides = 20;
num=15;
circleOffset = 0;

minkowski() {
 
    
        union(){
        for (i=[1:num])  {
            
            translate([innerPathRadius*cos((i+0.5)*(360/(num))),innerPathRadius*sin((i+0.5)*(360/(num+circleOffset))),0]) cylinder(r=1.5,h=midCylinderHeight, $fn=numberOfSides);
        }
    }
        cylinder(r=innerPathRadius-2,h=midCylinderHeight,$fn=numberOfSides);
        
    

    /*union(){
        for (i=[1:num])  {
            translate([outerPathRadius*cos(i*(360/num)),outerPathRadius*sin(i*(360/num)),-0.5]) cylinder(r=1.2,h=midCylinderHeight+1, $fn=numberOfSides);
        }
    }*/
 
     // children
 }


/*
    
    minkowski() {
 
    difference(){
    union(){
        for (i=[1:num])  {
            
            translate([innerPathRadius*cos((i+0.5)*(360/(num))),innerPathRadius*sin((i+0.5)*(360/(num+circleOffset))),0]) cylinder(r=1.5,h=midCylinderHeight, $fn=numberOfSides);
        }
        cylinder(r=innerPathRadius+0.2,h=midCylinderHeight,$fn=numberOfSides);
        
    }

    union(){
        for (i=[1:num])  {
            translate([outerPathRadius*cos(i*(360/num)),outerPathRadius*sin(i*(360/num)),-0.5]) cylinder(r=1.2,h=midCylinderHeight+1, $fn=numberOfSides);
        }
    }
    }
     // children
    }



*/